import mongoose, { Model } from "mongoose"

import { Minutes as MinutesType } from "@/types/dbInterface"

const minutesSchema = new mongoose.Schema(
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
    meetingDate: { type: Date, default: null },
    fileType: {
      type: String,
      enum: ["ppt", "pdf", "doc", "txt", "md", "xls", "link"]
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

minutesSchema.index({ organizationId: 1 })
minutesSchema.index({ "submittedBy.id": 1 })
minutesSchema.index({ deletedAt: 1 })
minutesSchema.index({ meetingDate: -1 })

let MinutesModel: Model<MinutesType>
try {
  MinutesModel = mongoose.model<MinutesType>("Minutes")
} catch {
  MinutesModel = mongoose.model<MinutesType>("Minutes", minutesSchema)
}

export { MinutesModel }
export type { MinutesType }
