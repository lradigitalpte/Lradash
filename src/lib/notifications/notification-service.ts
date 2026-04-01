/**
 * Notification system for handling mentions and comments
 * Provisions for email, push, and in-app notifications
 *
 * This can be extended with actual email/push providers (SendGrid, Firebase, etc.)
 */

import { Types } from "mongoose"

import { connectToDatabase } from "@/lib/db/connect"
import { createNotification } from "@/lib/db/notification"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { dispatchNotification } from "@/lib/notifications/dispatcher"
import { UserModel } from "@/models/user.model"

export interface NotificationPayload {
  userId: Types.ObjectId | string
  type: "mention" | "comment_reply" | "task_assigned"
  taskId: string
  commentId?: string
  mentionedByUser: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  taskTitle: string
  commentText: string
  methods: ("email" | "push" | "in-app")[]
}

export interface NotificationLog {
  userId: Types.ObjectId | string
  type: string
  method: "email" | "push" | "in-app"
  status: "pending" | "sent" | "failed"
  taskId: string
  commentId?: string
  error?: string
  retryCount: number
  createdAt: Date
  sentAt?: Date
}

/**
 * Send notifications to mentioned users
 * This is a flexible system that can be extended with various notification channels
 */
export async function sendMentionNotifications(
  payload: NotificationPayload,
  notificationLog?: (log: Partial<NotificationLog>) => Promise<void>
) {
  const results: any = {
    email: { status: "pending" as const, error: null },
    push: { status: "pending" as const, error: null },
    inApp: { status: "pending" as const, error: null }
  }

  try {
    if (String(payload.userId) === payload.mentionedByUser.id) {
      return {
        success: true,
        results,
        message: "Skipped self-mention notification"
      }
    }

    await connectToDatabase()
    const recipient = await UserModel.findById(payload.userId)
      .select("name email notificationEmail avatar")
      .lean()

    if (!recipient) {
      throw new Error("Mention recipient not found")
    }

    const commentPreview =
      payload.commentText.length > 160
        ? `${payload.commentText.slice(0, 157)}...`
        : payload.commentText

    await dispatchNotification({
      recipientUserId: String(payload.userId),
      type: payload.type,
      title: `Mentioned in ${payload.taskTitle}`,
      body: `${payload.mentionedByUser.name} mentioned you: ${commentPreview}`,
      taskId: payload.taskId,
      triggeredBy: {
        userId: payload.mentionedByUser.id,
        name: payload.mentionedByUser.name,
        avatar: payload.mentionedByUser.avatar
      },
      email: payload.methods.includes("email")
        ? {
            recipientEmail: getNotificationEmail(recipient as any),
            recipientName: (recipient as any).name ?? (recipient as any).email,
            taskTitle: payload.taskTitle,
            taskDescription: payload.commentText,
            actionLabel: "Open Task Discussion →"
          }
        : undefined
    })

    results.inApp.status = payload.methods.includes("in-app") ? "sent" : "pending"
    results.email.status = payload.methods.includes("email") ? "sent" : "pending"

    if (notificationLog) {
      await notificationLog({
        userId: payload.userId,
        type: payload.type,
        method: payload.methods.includes("email") ? "email" : "in-app",
        status: "sent",
        taskId: payload.taskId,
        commentId: payload.commentId,
        retryCount: 0,
        createdAt: new Date(),
        sentAt: new Date()
      })
    }

    return {
      success: true,
      results,
      message: `Notification queued for user ${payload.userId}`
    }
  } catch (error: any) {
    console.error("Error sending notifications:", error)
    return {
      success: false,
      results,
      error: error.message
    }
  }
}

/**
 * EMAIL NOTIFICATION TEMPLATE
 * To be implemented with actual email provider
 */
export async function sendEmailNotification(payload: NotificationPayload) {
  // Implementation example:
  // const mailContent = `
  //   Hi ${payload.mentionedByUser.name},
  //
  //   You were mentioned in a comment on "${payload.taskTitle}":
  //
  //   "${payload.commentText}"
  //
  //   View the full discussion: [link to task]
  // `;
  //
  // return await emailProvider.send({
  //   to: payload.userId.email,
  //   subject: `You were mentioned by ${payload.mentionedByUser.name}`,
  //   html: mailContent
  // });

  throw new Error("Email notification provider not configured")
}

/**
 * PUSH NOTIFICATION TEMPLATE
 * To be implemented with Firebase or similar
 */
export async function sendPushNotification(payload: NotificationPayload) {
  // Implementation example:
  // return await admin.messaging().send({
  //   notification: {
  //     title: `Mentioned by ${payload.mentionedByUser.name}`,
  //     body: payload.commentText.substring(0, 100)
  //   },
  //   data: {
  //     taskId: payload.taskId,
  //     commentId: payload.commentId,
  //     type: payload.type
  //   },
  //   token: userToken
  // });

  throw new Error("Push notification provider not configured")
}

/**
 * Mark a notification as sent
 */
export async function markNotificationAsSent(
  userId: Types.ObjectId | string,
  method: "email" | "push" | "in-app",
  taskId: string,
  commentId?: string
) {
  console.log(`✅ Marked ${method} notification as sent for user ${userId}`)
  // TODO: Update notification log in database
}

/**
 * Get pending notifications for a user
 */
export async function getPendingNotifications(userId: Types.ObjectId | string) {
  // TODO: Query database for pending notifications
  // Filter by userId and status = "pending"
  console.log(`🔍 Fetching pending notifications for user ${userId}`)
  return []
}

/**
 * Retry failed notifications
 */
export async function retryFailedNotifications(maxRetries = 3) {
  console.log(`🔄 Retrying failed notifications (max ${maxRetries} retries)`)
  // TODO: Query failed notifications with retryCount < maxRetries
  // Re-attempt sending them
}
