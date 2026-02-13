import mongoose, { Model } from "mongoose"

export interface MarketingReport {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  name: string
  selectedMetrics: Array<{
    id: string
    name: string
    type: string
    color: string
  }>
  createdBy: mongoose.Types.ObjectId
  sharedWith: mongoose.Types.ObjectId[]
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const marketingReportSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    name: { type: String, required: true },
    selectedMetrics: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
        color: { type: String, required: true }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPublic: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
marketingReportSchema.index({ projectId: 1 })
marketingReportSchema.index({ createdBy: 1 })

let MarketingReportModel: Model<MarketingReport>
try {
  MarketingReportModel = mongoose.model<MarketingReport>("MarketingReport")
} catch {
  MarketingReportModel = mongoose.model<MarketingReport>("MarketingReport", marketingReportSchema)
}

export { MarketingReportModel }
