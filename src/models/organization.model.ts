import mongoose, { Model } from "mongoose"

import { Organization as OrganizationType } from "@/types/dbInterface"

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    avatar: { type: String },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        role: {
          type: String,
          enum: ["OWNER", "ADMIN", "MEMBER", "CLIENT"],
          default: "MEMBER"
        },
        joinedAt: { type: Date, default: Date.now }
      }
    ],
    subscription: {
      plan: {
        type: String,
        enum: ["FREE", "PRO", "ENTERPRISE"],
        default: "FREE"
      },
      status: {
        type: String,
        enum: ["ACTIVE", "CANCELED", "EXPIRED"],
        default: "ACTIVE"
      },
      stripeCustomerId: { type: String },
      stripeSubscriptionId: { type: String },
      currentPeriodStart: { type: Date },
      currentPeriodEnd: { type: Date }
    },
    settings: {
      isPublic: { type: Boolean, default: false },
      allowInvitations: { type: Boolean, default: true }
    },
    deletedAt: { type: Date, default: null } // Soft delete
  },
  {
    timestamps: true
  }
)

// Indexes for performance
organizationSchema.index({ owner: 1 })
organizationSchema.index({ "members.userId": 1 })
organizationSchema.index({ deletedAt: 1 }) // For soft deletes

let OrganizationModel: Model<OrganizationType>
const existingOrganizationModel = mongoose.models.Organization as
  | Model<OrganizationType>
  | undefined

if (existingOrganizationModel) {
  const memberRolePath = existingOrganizationModel.schema.path("members") as
    | { schema?: { path: (name: string) => { options?: { enum?: string[] } } | undefined } }
    | undefined
  const enumValues = memberRolePath?.schema?.path("role")?.options?.enum

  if (!enumValues?.includes("CLIENT")) {
    mongoose.deleteModel("Organization")
    OrganizationModel = mongoose.model<OrganizationType>("Organization", organizationSchema)
  } else {
    OrganizationModel = existingOrganizationModel
  }
} else {
  OrganizationModel = mongoose.model<OrganizationType>("Organization", organizationSchema)
}

export { OrganizationModel }
export type { OrganizationType }
