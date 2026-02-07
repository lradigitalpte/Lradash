import mongoose, { Model } from "mongoose"

interface RefreshTokenType {
  _id?: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
  revokedAt?: Date
}

const refreshTokenSchema = new mongoose.Schema<RefreshTokenType>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    token: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
)

// Index for cleanup: find expired tokens
refreshTokenSchema.index({ expiresAt: 1 })
// Index for revocation lookups
refreshTokenSchema.index({ userId: 1, revokedAt: 1 })

let RefreshTokenModel: Model<RefreshTokenType>
try {
  RefreshTokenModel = mongoose.model<RefreshTokenType>("RefreshToken")
} catch {
  RefreshTokenModel = mongoose.model<RefreshTokenType>("RefreshToken", refreshTokenSchema)
}

export { RefreshTokenModel }
export type { RefreshTokenType }
