import mongoose, { Model } from "mongoose"

export interface GoogleConnection {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  clientId?: string // OAuth App Client ID
  clientSecret?: string // OAuth App Client Secret
  accessToken: string
  refreshToken: string
  tokenExpiresAt: Date
  propertyUrl: string // e.g., "https://example.com"
  propertyType: "domain" | "url-prefix"
  isActive: boolean
  lastSyncedAt?: Date
  configuredAt?: Date
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
    clientId: { type: String }, // Optional: if user provides custom OAuth credentials
    clientSecret: { type: String }, // Optional: if user provides custom OAuth credentials
    accessToken: { type: String }, // Not required during initial configuration
    refreshToken: { type: String }, // Not required during initial configuration
    tokenExpiresAt: { type: Date }, // Not required during initial configuration
    propertyUrl: { type: String }, // Not required during initial configuration
    propertyType: {
      type: String,
      enum: ["domain", "url-prefix"],
      required: true
    },
    isActive: { type: Boolean, default: true },
    lastSyncedAt: { type: Date },
    configuredAt: { type: Date } // When OAuth credentials were configured
  },
  {
    timestamps: true
  }
)

// Indexes for performance
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
