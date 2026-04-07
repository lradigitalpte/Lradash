import mongoose, { Model } from "mongoose"

interface ClientDigestLog {
  _id: string
  organizationId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  weekKey: string
  status: "PROCESSING" | "SENT" | "FAILED"
  error?: string
  sentAt?: Date
  createdAt: Date
  updatedAt: Date
}

const clientDigestLogSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    weekKey: {
      type: String,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["PROCESSING", "SENT", "FAILED"],
      default: "PROCESSING"
    },
    error: { type: String },
    sentAt: { type: Date }
  },
  {
    timestamps: true
  }
)

clientDigestLogSchema.index({ organizationId: 1, userId: 1, weekKey: 1 }, { unique: true })

const ClientDigestLogModel =
  (mongoose.models.ClientDigestLog as Model<ClientDigestLog>) ||
  mongoose.model<ClientDigestLog>("ClientDigestLog", clientDigestLogSchema)

export { ClientDigestLogModel }
