import mongoose, { Model, Schema } from "mongoose"

export interface IMonitorCheckResult {
  monitorId: mongoose.Types.ObjectId
  timestamp: Date
  status: "UP" | "DOWN" | "WARNING" | "PENDING" | "EXPIRED"
  responseTime?: number
}

const schema = new Schema<IMonitorCheckResult>(
  {
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: "Monitor",
      required: true,
      index: true
    },
    timestamp: { type: Date, required: true },
    status: {
      type: String,
      enum: ["UP", "DOWN", "WARNING", "PENDING", "EXPIRED"],
      required: true
    },
    responseTime: { type: Number }
  },
  { _id: true }
)

schema.index({ monitorId: 1, timestamp: -1 })

// Auto-delete check results older than 7 days so the collection doesn’t grow forever
const SEVEN_DAYS_SECONDS = 7 * 24 * 60 * 60
schema.index({ timestamp: 1 }, { expireAfterSeconds: SEVEN_DAYS_SECONDS })

const MonitorCheckResultModel: Model<IMonitorCheckResult> =
  mongoose.models.MonitorCheckResult ||
  mongoose.model<IMonitorCheckResult>("MonitorCheckResult", schema)

export default MonitorCheckResultModel
