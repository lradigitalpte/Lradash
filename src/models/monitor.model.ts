import mongoose, { Model, Schema } from "mongoose"

import { IMonitor, MonitorType, MonitorStatus } from "@/types/monitor"

const monitorSchema = new Schema<IMonitor>(
  {
    userId: {
      type: String, // Storing as string to match existing pattern if it's external IDs, or ObjectId if internal
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ["WEBSITE", "EMAIL", "SMTP", "SSL", "DOMAIN", "PORT", "SUBSCRIPTION"],
      required: true
    },
    target: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["UP", "DOWN", "PENDING", "EXPIRED", "WARNING"],
      default: MonitorStatus.PENDING
    },
    lastChecked: {
      type: Date
    },
    nextCheck: {
      type: Date,
      index: true
    },
    lastUp: {
      type: Date
    },
    lastDown: {
      type: Date
    },
    responseTime: {
      type: Number
    },
    expiryDate: {
      type: Date
    },
    price: {
      type: Number
    },
    currency: {
      type: String,
      default: "USD"
    },
    frequency: {
      type: Number,
      default: 5 // Default to 5 minutes
    },
    port: {
      type: Number,
      default: 25 // Default to standard SMTP port
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

// Index for efficient querying by cron job
monitorSchema.index({ nextCheck: 1, status: 1 })

const Monitor: Model<IMonitor> =
  mongoose.models.Monitor || mongoose.model<IMonitor>("Monitor", monitorSchema)

export default Monitor
