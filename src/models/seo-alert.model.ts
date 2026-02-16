import mongoose, { Model } from "mongoose"

export interface SEOAlert {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  name: string
  type: "keyword" | "page" | "technical" | "traffic" | "competitor" | "conversion"
  conditions: {
    metric: string
    operator: "gt" | "lt" | "gte" | "lte" | "eq" | "change"
    value: number
    changeThreshold?: number // For "change" operator
  }[]
  frequency: "immediate" | "hourly" | "daily" | "weekly"
  notificationChannels: {
    email: boolean
    sms: boolean
    inApp: boolean
    webhookUrl?: string
  }
  recipients: mongoose.Types.ObjectId[]
  isActive: boolean
  lastTriggered?: Date
  triggerCount: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const seoAlertSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["keyword", "page", "technical", "traffic", "competitor", "conversion"],
      required: true
    },
    conditions: [
      {
        metric: { type: String, required: true },
        operator: {
          type: String,
          enum: ["gt", "lt", "gte", "lte", "eq", "change"],
          required: true
        },
        value: { type: Number, required: true },
        changeThreshold: { type: Number }
      }
    ],
    frequency: {
      type: String,
      enum: ["immediate", "hourly", "daily", "weekly"],
      default: "daily"
    },
    notificationChannels: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      inApp: { type: Boolean, default: true },
      webhookUrl: { type: String }
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    isActive: { type: Boolean, default: true },
    lastTriggered: { type: Date },
    triggerCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
seoAlertSchema.index({ projectId: 1, isActive: 1 })
seoAlertSchema.index({ projectId: 1, type: 1 })

let SEOAlertModel: Model<SEOAlert>
try {
  SEOAlertModel = mongoose.model<SEOAlert>("SEOAlert")
} catch {
  SEOAlertModel = mongoose.model<SEOAlert>("SEOAlert", seoAlertSchema)
}

export { SEOAlertModel }
