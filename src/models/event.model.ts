import mongoose, { Model } from "mongoose"

import { Event as EventType } from "@/types/dbInterface"

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    type: {
      type: String,
      enum: ["sync", "blocked", "buffer"],
      default: "sync",
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isAllDay: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null } // Soft delete
  },
  {
    timestamps: true
  }
)

// Indexes for performance
eventSchema.index({ organizationId: 1 })
eventSchema.index({ creatorId: 1 })
eventSchema.index({ startTime: 1, endTime: 1 })
eventSchema.index({ deletedAt: 1 })

function getEventModel(): Model<EventType> {
  return (
    (mongoose.models.Event as Model<EventType>) || mongoose.model<EventType>("Event", eventSchema)
  )
}

const EventModel = getEventModel()

export { EventModel }
export type { EventType }
