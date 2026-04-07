/**
 * Email notification service.
 *
 * Fire-and-forget email delivery via Gmail SMTP.
 * Integrated into the notification dispatcher so every task event
 * that dispatches an in-app notification can also send an email.
 */

import type { NotificationType } from "@/models/notification.model"

import {
  taskAssignedEmail,
  taskUpdatedEmail,
  taskCreatedEmail,
  taskDeadlineReminderEmail,
  taskCompletedEmail,
  mentionEmail,
  announcementCreatedEmail,
  type TaskEmailData
} from "@/lib/email/templates"
import { getTransporter, getFromAddress } from "@/lib/email/transporter"
import { getLocalizedNotificationRoute } from "@/lib/notifications/routing"
import { getAppUrl } from "@/lib/url/get-app-url"

export interface SendTaskEmailInput {
  to: string
  recipientName: string
  type: NotificationType
  taskTitle: string
  taskDescription?: string
  taskStatus?: string
  taskPriority?: string
  taskDueDate?: string
  projectName?: string
  projectId?: string
  taskId: string
  triggeredByName: string
  triggeredByAvatar?: string
  /** Short description of what changed (for task_updated) */
  changes?: string
  actionUrl?: string
  actionLabel?: string
}

export async function sendTaskEmail(input: SendTaskEmailInput): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) {
    return false
  }

  const appUrl = getAppUrl()
  const taskRoute = getLocalizedNotificationRoute("en", {
    type: input.type,
    taskId: input.taskId,
    projectId: input.projectId
  })
  const taskUrl = `${appUrl}${taskRoute}`

  const emailData: TaskEmailData = {
    taskTitle: input.taskTitle,
    taskDescription: input.taskDescription,
    taskStatus: input.taskStatus,
    taskPriority: input.taskPriority,
    taskDueDate: input.taskDueDate,
    projectName: input.projectName,
    triggeredByName: input.triggeredByName,
    triggeredByAvatar: input.triggeredByAvatar,
    recipientName: input.recipientName,
    taskUrl,
    appUrl,
    actionUrl: input.actionUrl,
    actionLabel: input.actionLabel
  }

  let email: { subject: string; html: string }

  switch (input.type) {
    case "task_assigned":
      email = taskAssignedEmail(emailData)
      break
    case "task_updated":
    case "status_change":
      email = taskUpdatedEmail({
        ...emailData,
        changes: input.changes || "Task details were updated"
      })
      break
    case "task_completed":
      email = taskCompletedEmail(emailData)
      break
    case "task_created":
      email = taskCreatedEmail(emailData)
      break
    case "task_deadline_reminder":
      email = taskDeadlineReminderEmail(emailData)
      break
    case "mention":
      email = mentionEmail(emailData)
      break
    case "announcement_created":
      email = announcementCreatedEmail(emailData)
      break
    default:
      return false
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: input.to,
      subject: email.subject,
      html: email.html
    })
    console.log(`[Email] Sent ${input.type} email to ${input.to} for task "${input.taskTitle}"`)
    return true
  } catch (err) {
    console.error(`[Email] Failed to send ${input.type} to ${input.to}:`, err)
    return false
  }
}
