import mongoose, { Model } from "mongoose"

export interface UptimeRobotIntegration {
  _id: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  apiToken: string
  statusPageUrl?: string
  configuredAt: Date
  updatedAt: Date
}

const uptimeRobotIntegrationSchema = new mongoose.Schema<UptimeRobotIntegration>(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
      index: true
    },
    apiToken: { type: String, required: true },
    statusPageUrl: { type: String, default: "" },
    configuredAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
)

let UptimeRobotIntegrationModel: Model<UptimeRobotIntegration>
try {
  UptimeRobotIntegrationModel = mongoose.model<UptimeRobotIntegration>("UptimeRobotIntegration")
} catch {
  UptimeRobotIntegrationModel = mongoose.model<UptimeRobotIntegration>(
    "UptimeRobotIntegration",
    uptimeRobotIntegrationSchema
  )
}

export { UptimeRobotIntegrationModel }
