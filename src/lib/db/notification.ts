import { connectToDatabase } from "@/lib/db/connect"
import {
  NotificationModel,
  type INotificationDoc,
  type NotificationType
} from "@/models/notification.model"

export interface CreateNotificationInput {
  userId: string
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
}

/** Persist a new in-app notification and return the plain object */
export async function createNotification(
  input: CreateNotificationInput
): Promise<INotificationDoc> {
  await connectToDatabase()
  const doc = await NotificationModel.create({
    ...input,
    read: false,
    method: "in-app",
    status: "sent"
  })
  return doc.toObject() as INotificationDoc
}

/** Get the most recent 50 unread/read notifications for a user */
export async function getUserNotifications(
  userId: string,
  limit = 50
): Promise<INotificationDoc[]> {
  await connectToDatabase()
  const docs = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean()
  return docs as unknown as INotificationDoc[]
}

/** Count unread notifications for a user */
export async function countUnread(userId: string): Promise<number> {
  await connectToDatabase()
  return NotificationModel.countDocuments({ userId, read: false })
}

/** Mark a single notification as read */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<boolean> {
  await connectToDatabase()
  const result = await NotificationModel.updateOne(
    { _id: notificationId, userId },
    { $set: { read: true, readAt: new Date() } }
  )
  return result.modifiedCount > 0
}

/** Mark all notifications as read for a user */
export async function markAllNotificationsRead(userId: string): Promise<number> {
  await connectToDatabase()
  const result = await NotificationModel.updateMany(
    { userId, read: false },
    { $set: { read: true, readAt: new Date() } }
  )
  return result.modifiedCount
}

/** Delete a single notification for a user */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  await connectToDatabase()
  const result = await NotificationModel.deleteOne({ _id: notificationId, userId })
  return result.deletedCount > 0
}

/** Delete all notifications for a user */
export async function deleteAllNotifications(userId: string): Promise<number> {
  await connectToDatabase()
  const result = await NotificationModel.deleteMany({ userId })
  return result.deletedCount ?? 0
}

/** Store a Firebase FCM token for a user (upsert on device fingerprint) */
export async function saveFcmToken(userId: string, token: string): Promise<void> {
  await connectToDatabase()
  const { UserModel } = await import("@/models/user.model")
  await UserModel.updateOne({ _id: userId }, { $addToSet: { fcmTokens: token } })
}

/** Get all FCM tokens for a user */
export async function getUserFcmTokens(userId: string): Promise<string[]> {
  await connectToDatabase()
  const { UserModel } = await import("@/models/user.model")
  const user = await UserModel.findById(userId).select("fcmTokens").lean()
  return (user as any)?.fcmTokens ?? []
}
