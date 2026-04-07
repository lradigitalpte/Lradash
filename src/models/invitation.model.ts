import mongoose, { Model } from "mongoose"

import { UserRole } from "@/types/dbInterface"

export interface InvitationDocument {
  _id: string
  email: string
  organizationId: mongoose.Types.ObjectId
  token: string
  invitedBy: mongoose.Types.ObjectId
  role: UserRole
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED"
  expiresAt: Date
  acceptedAt?: Date | null
  acceptedBy?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const invitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    token: { type: String, required: true, unique: true, index: true },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER, UserRole.CLIENT],
      default: UserRole.MEMBER
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"],
      default: "PENDING",
      index: true
    },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date, default: null },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
)

invitationSchema.index({ organizationId: 1, email: 1, status: 1 })

let InvitationModel: Model<InvitationDocument>
const existingInvitationModel = mongoose.models.Invitation as Model<InvitationDocument> | undefined

if (existingInvitationModel) {
  const enumValues = existingInvitationModel.schema.path("role")?.options?.enum as
    | string[]
    | undefined

  if (!enumValues?.includes(UserRole.CLIENT)) {
    mongoose.deleteModel("Invitation")
    InvitationModel = mongoose.model<InvitationDocument>("Invitation", invitationSchema)
  } else {
    InvitationModel = existingInvitationModel
  }
} else {
  InvitationModel = mongoose.model<InvitationDocument>("Invitation", invitationSchema)
}

export { InvitationModel }
