import mongoose, { Model } from "mongoose"

import { Board as BoardType } from "@/types/dbInterface"

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: false,
      default: null
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    listIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "List"
      }
    ],
    isPrivate: { type: Boolean, default: true }, // Personal boards are private by default
    isArchived: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null } // Soft delete
  },
  {
    timestamps: true
  }
)

// Indexes for performance
boardSchema.index({ projectId: 1 })
boardSchema.index({ organizationId: 1 })
boardSchema.index({ owner: 1 })
boardSchema.index({ projectId: 1, organizationId: 1 })
boardSchema.index({ deletedAt: 1 })

let BoardModel: Model<BoardType>
try {
  BoardModel = mongoose.model<BoardType>("Board")
} catch {
  BoardModel = mongoose.model<BoardType>("Board", boardSchema)
}

export { BoardModel }
export type { BoardType }
