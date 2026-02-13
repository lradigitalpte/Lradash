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
        createdAt: { type: Date, default: Date.now }
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
taskSchema.index({ assignee: 1 })
taskSchema.index({ creator: 1 })
taskSchema.index({ organizationId: 1, board: 1, project: 1 })
taskSchema.index({ deletedAt: 1 })

function isTaskModel(model: any): model is Model<TaskType> {
  return model && model.modelName === "Task"
}

function getTaskModel(): Model<TaskType> {
  return (mongoose.models.Task as Model<TaskType>) || mongoose.model<TaskType>("Task", taskSchema)
}

const TaskModel = getTaskModel()

export { TaskModel }
export type { TaskType }
