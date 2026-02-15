import mongoose, { Model } from "mongoose"

import { WorkPackage as WorkPackageType } from "@/types/dbInterface"

const workPackageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "COMPLETED", "ON_HOLD"],
      default: "TODO",
      required: true
    },
    dueDate: { type: Date },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: false
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
      }
    ],
    progress: { type: Number, default: 0, min: 0, max: 100 },
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
workPackageSchema.index({ organizationId: 1 })
workPackageSchema.index({ boardId: 1 })
workPackageSchema.index({ projectId: 1 })
workPackageSchema.index({ owner: 1 })
workPackageSchema.index({ organizationId: 1, boardId: 1, projectId: 1 })
workPackageSchema.index({ deletedAt: 1 })

let WorkPackageModel: Model<WorkPackageType>
try {
  WorkPackageModel = mongoose.model<WorkPackageType>("WorkPackage")
} catch {
  WorkPackageModel = mongoose.model<WorkPackageType>("WorkPackage", workPackageSchema)
}

export { WorkPackageModel }
export type { WorkPackageType }
