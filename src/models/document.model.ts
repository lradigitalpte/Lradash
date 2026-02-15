import mongoose, { Model } from "mongoose"

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: String, required: true }, // Store as string for display (e.g., "2.4 MB") or number in bytes
    url: { type: String }, // URL to the file storage
    folder: { type: String, default: "General" },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes
documentSchema.index({ project: 1, createdAt: -1 })
documentSchema.index({ organizationId: 1 })

// Check if model already exists to prevent overwrite error
let DocumentModel: Model<any>
try {
  DocumentModel = mongoose.model("Document")
} catch {
  DocumentModel = mongoose.model("Document", documentSchema)
}

export { DocumentModel }
