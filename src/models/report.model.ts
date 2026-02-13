import mongoose, { Model } from "mongoose"

import { Report as ReportType } from "@/types/dbInterface"

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    submittedBy: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      name: { type: String, required: true },
      email: { type: String },
      avatar: { type: String }
    },
    submittedAt: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    weekNumber: { type: Number, required: true },
    year: { type: Number, required: true },
    status: {
      type: String,
      enum: ["submitted", "overdue", "pending"],
      default: "submitted"
    },
    fileType: {
      type: String,
      enum: ["ppt", "pdf", "doc", "link"]
    },
    fileUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: String },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
)

reportSchema.index({ organizationId: 1 })
reportSchema.index({ "submittedBy.id": 1 })
reportSchema.index({ deletedAt: 1 })

let ReportModel: Model<ReportType>
try {
  ReportModel = mongoose.model<ReportType>("Report")
} catch {
  ReportModel = mongoose.model<ReportType>("Report", reportSchema)
}

export { ReportModel }
export type { ReportType }
