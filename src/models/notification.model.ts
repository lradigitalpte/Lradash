import mongoose, { Model } from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["mention", "comment_reply", "task_assigned", "status_change"],
      required: true
    },
    method: {
      type: String,
      enum: ["email", "push", "in-app"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending"
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    },
    readAt: {
      type: Date,
      required: false // For in-app notifications
    }
  },
  {
    timestamps: true
  }
)

// Index for fast queries
notificationSchema.index({ userId: 1, status: 1 })
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ taskId: 1 })
notificationSchema.index({ status: 1 })

function isNotificationModel(model: any): model is Model<any> {
  return model && model.modelName === "Notification"
}

function getNotificationModel(): Model<any> {
  return mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
}

export { getNotificationModel, isNotificationModel }
export const NotificationModel = getNotificationModel()
