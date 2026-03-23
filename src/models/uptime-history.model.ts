import mongoose from "mongoose"

const uptimeHistorySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  monitorId: { type: String, required: true, index: true },
  monitorName: { type: String, default: "" },
  status: { type: String, enum: ["UP", "DOWN", "WARNING"], required: true },
  checkedAt: { type: Date, default: Date.now }
})

// Compound index for efficient per-monitor queries
uptimeHistorySchema.index({ organizationId: 1, monitorId: 1, checkedAt: -1 })

// Auto-expire entries after 7 days
uptimeHistorySchema.index({ checkedAt: 1 }, { expireAfterSeconds: 604800 })

export const UptimeHistoryModel =
  mongoose.models.UptimeHistory ||
  mongoose.model("UptimeHistory", uptimeHistorySchema, "uptimehistories")
