import mongoose, { Model } from "mongoose"

import { Project as ProjectType } from "@/types/dbInterface"

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null } // Soft delete
  },
  {
    timestamps: true
  }
)

// Indexes for performance
projectSchema.index({ organizationId: 1 })
projectSchema.index({ owner: 1 })
projectSchema.index({ organizationId: 1, owner: 1 })
projectSchema.index({ deletedAt: 1 })

let ProjectModel: Model<ProjectType>
try {
  ProjectModel = mongoose.model<ProjectType>("Project")
} catch {
  ProjectModel = mongoose.model<ProjectType>("Project", projectSchema)
}

export { ProjectModel }
export type { ProjectType }
