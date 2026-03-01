import mongoose, { Model } from "mongoose"

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
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
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
)

folderSchema.index({ project: 1, name: 1 }, { unique: true })

let FolderModel: Model<any>
try {
  FolderModel = mongoose.model("Folder")
} catch {
  FolderModel = mongoose.model("Folder", folderSchema)
}

export { FolderModel }
