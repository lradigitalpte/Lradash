import mongoose, { Model } from "mongoose"

export type NotificationType =
  | "task_created"
  | "task_updated"
  | "task_assigned"
  | "task_completed"
  | "status_change"
  | "mention"
  | "comment_reply"
  | "announcement_created"

export interface INotificationDoc {
  _id: string
  userId: mongoose.Types.ObjectId | string
  type: NotificationType
  title: string
  body: string
  // Legacy fields (kept for backwards compat)
  method?: "email" | "push" | "in-app"
  status?: "pending" | "sent" | "failed"
  taskId?: mongoose.Types.ObjectId | string
  projectId?: string
  commentId?: mongoose.Types.ObjectId | string
  triggeredBy?: {
    userId?: string
    name?: string
    avatar?: string
  }
  read: boolean
  readAt?: Date
  error?: string
  retryCount?: number
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    type: {
      type: String,
      enum: [
        "task_created",
        "task_updated",
        "task_assigned",
        "task_completed",
        "status_change",
        "mention",
        "comment_reply",
        "announcement_created"
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    body: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: ["email", "push", "in-app"],
      required: false
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },
    taskId: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    },
    projectId: {
      type: String,
      required: false
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    triggeredBy: {
      userId: { type: String },
      name: { type: String },
      avatar: { type: String }
    },
    read: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date,
      required: false
    },
    error: {
      type: String,
      required: false
    },
    retryCount: {
      type: Number,
      default: 0
    },
    sentAt: {
      type: Date,
      required: false
    }
  },
  {
    timestamps: true
  }
)

// Indexes for fast queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ taskId: 1 })

// TTL: auto-delete after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 })

function isNotificationModel(model: any): model is Model<any> {
  return model && model.modelName === "Notification"
}

function getNotificationModel(): Model<any> {
  if (mongoose.models.Notification) {
    return mongoose.models.Notification
  }
  return mongoose.model("Notification", notificationSchema)
}

export { getNotificationModel, isNotificationModel }
export const NotificationModel = getNotificationModel()
