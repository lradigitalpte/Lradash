import mongoose, { Model } from "mongoose"

import { GoogleWorkspaceAccount } from "@/types/dbInterface"

const googleWorkspaceAccountSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    email: { type: String },
    googleUserId: { type: String },
    scopes: [{ type: String }],
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenExpiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
    lastRefreshedAt: { type: Date },
    disconnectedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
)

googleWorkspaceAccountSchema.index({ organizationId: 1, userId: 1 }, { unique: true })
googleWorkspaceAccountSchema.index({ organizationId: 1, isActive: 1 })
googleWorkspaceAccountSchema.index({ userId: 1, isActive: 1 })

let GoogleWorkspaceAccountModel: Model<GoogleWorkspaceAccount>

try {
  GoogleWorkspaceAccountModel = mongoose.model<GoogleWorkspaceAccount>("GoogleWorkspaceAccount")
} catch {
  GoogleWorkspaceAccountModel = mongoose.model<GoogleWorkspaceAccount>(
    "GoogleWorkspaceAccount",
    googleWorkspaceAccountSchema
  )
}

export { GoogleWorkspaceAccountModel }
