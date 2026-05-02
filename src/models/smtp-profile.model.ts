import mongoose, { Model } from "mongoose"

export interface SmtpProfileDoc {
  _id: mongoose.Types.ObjectId
  organizationId: mongoose.Types.ObjectId
  label: string
  host: string
  port: number
  secure: boolean
  authUser: string
  passwordEnc: string
  fromName: string
  fromEmail: string
  lastTestAt?: Date | null
  lastTestOk?: boolean | null
  lastTestMessage?: string | null
  createdBy?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const smtpProfileSchema = new mongoose.Schema<SmtpProfileDoc>(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    label: { type: String, required: true, trim: true },
    host: { type: String, required: true, trim: true },
    port: { type: Number, required: true, min: 1, max: 65535 },
    secure: { type: Boolean, default: false },
    authUser: { type: String, required: true, trim: true },
    passwordEnc: { type: String, required: true },
    fromName: { type: String, default: "", trim: true },
    fromEmail: { type: String, required: true, trim: true, lowercase: true },
    lastTestAt: { type: Date, default: null },
    lastTestOk: { type: Boolean, default: null },
    lastTestMessage: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
  },
  { timestamps: true }
)

smtpProfileSchema.index({ organizationId: 1, label: 1 })

let SmtpProfileModel: Model<SmtpProfileDoc>
const existing = mongoose.models.SmtpProfile as Model<SmtpProfileDoc> | undefined
if (existing) {
  SmtpProfileModel = existing
} else {
  SmtpProfileModel = mongoose.model<SmtpProfileDoc>("SmtpProfile", smtpProfileSchema)
}

export { SmtpProfileModel }
