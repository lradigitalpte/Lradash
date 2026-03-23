import mongoose, { Schema, Document } from "mongoose"

export interface EngagementLog {
  date: Date
  likes: number
  shares: number
  comments: number
  reach: number
}

export interface MarketingStrategyTargets {
  reach: number
  likes: number
  shares: number
  comments: number
  deadline?: Date
}

export interface MarketingStrategy extends Document {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  title: string
  description?: string
  platform: "twitter" | "facebook" | "instagram" | "linkedin" | "tiktok" | "other"
  status: "planning" | "active" | "in-progress" | "completed" | "paused"
  targets?: MarketingStrategyTargets
  engagementLogs: EngagementLog[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

const EngagementLogSchema = new Schema({
  date: { type: Date, required: true },
  likes: { type: Number, default: 0, min: 0 },
  shares: { type: Number, default: 0, min: 0 },
  comments: { type: Number, default: 0, min: 0 },
  reach: { type: Number, default: 0, min: 0 }
})

const TargetsSchema = new Schema({
  reach: { type: Number, default: 0, min: 0 },
  likes: { type: Number, default: 0, min: 0 },
  shares: { type: Number, default: 0, min: 0 },
  comments: { type: Number, default: 0, min: 0 },
  deadline: { type: Date }
})

const MarketingStrategySchema = new Schema<MarketingStrategy>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    title: { type: String, required: true },
    description: { type: String },
    platform: {
      type: String,
      enum: ["twitter", "facebook", "instagram", "linkedin", "tiktok", "other"],
      required: true
    },
    status: {
      type: String,
      enum: ["planning", "active", "in-progress", "completed", "paused"],
      default: "planning"
    },
    targets: { type: TargetsSchema },
    engagementLogs: [EngagementLogSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    deletedAt: { type: Date }
  },
  { timestamps: true }
)

// Soft delete index
MarketingStrategySchema.index({ deletedAt: 1 })

export const MarketingStrategyModel =
  mongoose.models.MarketingStrategy ||
  mongoose.model<MarketingStrategy>("MarketingStrategy", MarketingStrategySchema)
