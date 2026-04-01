/**
 * Central notification dispatcher.
 * Called by task routes after create / update operations.
 *
 * Flow:
 *  1. Persist the notification in MongoDB
 *  2. Push via SSE to any open browser tab (real-time)
 *  3. Send Firebase push notification if user has FCM tokens (background tab / mobile)
 *  4. Send email notification via Gmail SMTP (fire-and-forget)
 */

import type { NotificationType } from "@/models/notification.model"

import {
  createNotification,
  getUserFcmTokens,
  type CreateNotificationInput
} from "@/lib/db/notification"
import { sendTaskEmail } from "@/lib/email/send-task-email"
import { emitToUser } from "@/lib/notifications/sse-emitter"

export interface DispatchNotificationInput {
  /** The user who should RECEIVE this notification */
  recipientUserId: string
  type: NotificationType
  title: string
  body: string
  taskId?: string
  projectId?: string
  triggeredBy: {
    userId: string
    name: string
    avatar?: string
  }
  /** Optional email-specific fields for richer email content */
  email?: {
    recipientEmail: string
    recipientName: string
    taskTitle: string
    taskDescription?: string
    taskStatus?: string
    taskPriority?: string
    taskDueDate?: string
    projectName?: string
    changes?: string
    actionUrl?: string
    actionLabel?: string
  }
}

export async function dispatchNotification(input: DispatchNotificationInput): Promise<void> {
  try {
    // 1. Persist in MongoDB
    const dbInput: CreateNotificationInput = {
      userId: input.recipientUserId,
      type: input.type,
      title: input.title,
      body: input.body,
      taskId: input.taskId,
      projectId: input.projectId,
      triggeredBy: input.triggeredBy
    }
    const notification = await createNotification(dbInput)

    // 2. Push via SSE to connected browser tabs
    emitToUser(input.recipientUserId, notification)

    // 3. Firebase push notification (only if user is NOT currently connected via SSE)
    //    We attempt FCM regardless – the browser will deduplicate if the tab is open
    await sendFirebasePush(input.recipientUserId, input.title, input.body, input.taskId)

    // 4. Email notification (fire-and-forget)
    if (input.email?.recipientEmail) {
      sendTaskEmail({
        to: input.email.recipientEmail,
        recipientName: input.email.recipientName,
        type: input.type,
        taskTitle: input.email.taskTitle,
        taskDescription: input.email.taskDescription,
        taskStatus: input.email.taskStatus,
        taskPriority: input.email.taskPriority,
        taskDueDate: input.email.taskDueDate,
        projectName: input.email.projectName,
        taskId: input.taskId || "",
        triggeredByName: input.triggeredBy.name,
        triggeredByAvatar: input.triggeredBy.avatar,
        changes: input.email.changes,
        actionUrl: input.email.actionUrl,
        actionLabel: input.email.actionLabel
      }).catch((err) => {
        console.error("[Email] fire-and-forget error:", err)
      })
    }
  } catch (err) {
    console.error("[dispatchNotification] Error:", err)
  }
}

async function sendFirebasePush(
  userId: string,
  title: string,
  body: string,
  taskId?: string
): Promise<void> {
  try {
    const tokens = await getUserFcmTokens(userId)
    if (tokens.length === 0) {
      return
    }

    // Dynamically import firebase-admin to avoid issues with edge runtime
    const { getFirebaseAdmin } = await import("../firebase/admin")
    const _admin = await getFirebaseAdmin()
    if (!_admin) {
      return
    }

    const { getMessaging } = await import("firebase-admin/messaging")
    const messaging = getMessaging()
    const results = await Promise.allSettled(
      tokens.map(async (token) =>
        messaging.send({
          token,
          notification: { title, body },
          webpush: {
            notification: {
              title,
              body,
              icon: "/icons/icon-192x192.png",
              badge: "/icons/badge-72x72.png",
              data: { taskId }
            },
            fcmOptions: {
              link: taskId ? `/dashboard/tasks/${taskId}` : "/dashboard"
            }
          }
        })
      )
    )

    const failed = results.filter((r) => r.status === "rejected")
    if (failed.length > 0) {
      console.warn(`[FCM] ${failed.length}/${tokens.length} push(es) failed`)
    }
  } catch (err) {
    console.error("[FCM] sendFirebasePush error:", err)
  }
}
