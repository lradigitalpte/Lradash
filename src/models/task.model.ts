import mongoose, { Model } from "mongoose"

import { Task as TaskType } from "@/types/dbInterface"

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
      required: true
    },
    dueDate: { type: Date },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: false // Optional for personal tasks
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false // Optional for personal tasks
    },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    lastModifier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },
    workPackage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkPackage",
      required: false // Optional: tasks can exist independently or be linked to work packages
    },
    checklist: [
      {
        text: { type: String, required: true },
        completed: { type: Boolean, default: false }
      }
    ],
    labels: [
      {
        name: { type: String, required: true },
        color: { type: String, required: true }
      }
    ],
    coverColor: { type: String },
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null }, // Soft delete
    activities: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["comment", "activity"], required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        mentions: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            userName: { type: String }
          }
        ],
        notificationsSent: [
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            sentAt: { type: Date, default: Date.now },
            method: { type: String, enum: ["email", "push", "in-app"], default: "in-app" },
            status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" }
          }
        ]
      }
    ],
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String },
        size: { type: Number },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    deadlineReminder12hSentAt: { type: Date },
    completionSubmissions: [
      {
        submittedBy: {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          name: { type: String, required: true },
          email: { type: String },
          avatar: { type: String }
        },
        submittedAt: { type: Date, default: Date.now },
        evidenceNote: { type: String },
        evidenceAttachments: [
          {
            name: { type: String, required: true },
            url: { type: String, required: true },
            type: { type: String },
            size: { type: Number }
          }
        ],
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending"
        },
        reviewedBy: {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          name: { type: String },
          email: { type: String },
          avatar: { type: String }
        },
        reviewedAt: { type: Date },
        reviewNote: { type: String },
        reviewAttachments: [
          {
            name: { type: String, required: true },
            url: { type: String, required: true },
            type: { type: String },
            size: { type: Number }
          }
        ],
        reviewHistory: [
          {
            reviewer: {
              userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              name: { type: String },
              email: { type: String },
              avatar: { type: String }
            },
            action: {
              type: String,
              enum: ["approve", "reject", "review"],
              required: true
            },
            note: { type: String },
            attachments: [
              {
                name: { type: String, required: true },
                url: { type: String, required: true },
                type: { type: String },
                size: { type: Number }
              }
            ],
            createdAt: { type: Date, default: Date.now }
          }
        ]
      }
    ]
  },
  {
    timestamps: true
  }
)

// Indexes for performance
taskSchema.index({ organizationId: 1 })
taskSchema.index({ board: 1 })
taskSchema.index({ project: 1 })
taskSchema.index({ workPackage: 1 })
taskSchema.index({ assignee: 1 })
taskSchema.index({ creator: 1 })
taskSchema.index({ organizationId: 1, board: 1, project: 1 })
taskSchema.index({ organizationId: 1, workPackage: 1 })
taskSchema.index({ deletedAt: 1 })

function isTaskModel(model: any): model is Model<TaskType> {
  return model && model.modelName === "Task"
}

function getTaskModel(): Model<TaskType> {
  const existingTaskModel = mongoose.models.Task as Model<TaskType> | undefined

  if (existingTaskModel) {
    const completionPath = existingTaskModel.schema.path("completionSubmissions")
    const hasReviewHistory = Boolean(completionPath?.schema?.path("reviewHistory"))

    if (!existingTaskModel.schema.path("deadlineReminder12hSentAt") || !hasReviewHistory) {
      mongoose.deleteModel("Task")
      return mongoose.model<TaskType>("Task", taskSchema)
    }
    return existingTaskModel
  }

  return mongoose.model<TaskType>("Task", taskSchema)
}

const TaskModel = getTaskModel()

export { TaskModel }
export type { TaskType }
