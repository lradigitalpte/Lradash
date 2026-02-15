import mongoose, { Model } from "mongoose"

import { List as ListType } from "@/types/dbInterface"

const listSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    position: { type: Number, default: 999 }, // For ordering lists
    cardIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
      }
    ],
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null } // Soft delete
  },
  {
    timestamps: true
  }
)

// Indexes for performance
listSchema.index({ boardId: 1 })
listSchema.index({ projectId: 1 })
listSchema.index({ organizationId: 1 })
listSchema.index({ boardId: 1, organizationId: 1 })
listSchema.index({ position: 1 })
listSchema.index({ deletedAt: 1 })

let ListModel: Model<ListType>
try {
  ListModel = mongoose.model<ListType>("List")
} catch {
  ListModel = mongoose.model<ListType>("List", listSchema)
}

export { ListModel }
export type { ListType }
