import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISEOChecklistItem extends Document {
  _id: any
  projectId: string
  organizationId: string
  title: string
  description: string
  completed: boolean
  category: "research" | "onpage" | "technical" | "content" | "links"
  notes?: string
  completedAt?: Date
  completedBy?: string
  createdAt: Date
  updatedAt: Date
  order?: number
}

const seoChecklistItemSchema = new Schema<ISEOChecklistItem>(
  {
    projectId: {
      type: String,
      required: true,
      index: true
    },
    organizationId: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      enum: ["research", "onpage", "technical", "content", "links"],
      required: true,
      index: true
    },
    notes: {
      type: String,
      trim: true
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: String
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

// Compound index for efficient queries
seoChecklistItemSchema.index({ projectId: 1, category: 1, order: 1 })

const SEOChecklistItem: Model<ISEOChecklistItem> =
  mongoose.models.SEOChecklistItem ||
  mongoose.model<ISEOChecklistItem>("SEOChecklistItem", seoChecklistItemSchema)

export default SEOChecklistItem
