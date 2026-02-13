import mongoose, { Model } from "mongoose"

export interface GoogleConnection {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
  propertyUrl: string // e.g., "https://example.com"
  propertyType: "domain" | "url-prefix"
  isActive: boolean
  lastSyncedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const googleConnectionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true // One connection per project
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date, required: true },
    propertyUrl: { type: String, required: true },
    propertyType: {
      type: String,
      enum: ["domain", "url-prefix"],
      required: true
    },
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
googleConnectionSchema.index({ projectId: 1 })
googleConnectionSchema.index({ isActive: 1 })

let GoogleConnectionModel: Model<GoogleConnection>
try {
  GoogleConnectionModel = mongoose.model<GoogleConnection>("GoogleConnection")
} catch {
  GoogleConnectionModel = mongoose.model<GoogleConnection>(
    "GoogleConnection",
    googleConnectionSchema
  )
}

export { GoogleConnectionModel }
