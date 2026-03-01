import mongoose, { Model } from "mongoose"

import { User as UserType } from "@/types/dbInterface"

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String }, // For email+password auth
    avatar: { type: String },
    role: { type: String, default: "MEMBER" },
    defaultOrganizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization"
    },
    // OAuth providers
    providers: {
      google: { id: String },
      github: { id: String }
    },
    // User preferences
    preferences: {
      theme: { type: String, enum: ["light", "dark"], default: "light" },
      language: { type: String, default: "en" },
      emailNotifications: { type: Boolean, default: true }
    },
    // Account status
    emailVerified: { type: Date },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
      default: "ACTIVE"
    },
    deletedAt: { type: Date, default: null }, // Soft delete
    // Firebase Cloud Messaging tokens for push notifications
    fcmTokens: { type: [String], default: [] }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
userSchema.index({ defaultOrganizationId: 1 })
userSchema.index({ deletedAt: 1 })

let UserModel: Model<UserType>
try {
  UserModel = mongoose.model<UserType>("User")
} catch {
  UserModel = mongoose.model<UserType>("User", userSchema)
}

export { UserModel }
