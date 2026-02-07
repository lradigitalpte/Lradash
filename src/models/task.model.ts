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
      required: true
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
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
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null } // Soft delete
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
  if (isTaskModel(mongoose.models.Task)) {
    return mongoose.models.Task
  }
  return mongoose.model<TaskType>("Task", taskSchema)
}

const TaskModel = getTaskModel()

export { TaskModel }
export type { TaskType }
