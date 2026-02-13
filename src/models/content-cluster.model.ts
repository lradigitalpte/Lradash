import mongoose, { Model } from "mongoose"

export interface ContentCluster {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  name: string
  subtopics: string[]
  authorityScore: number // 0-100
  status: "planning" | "building" | "active" | "strong"
  pillarPageUrl?: string
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const contentClusterSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    name: { type: String, required: true },
    subtopics: [{ type: String }],
    authorityScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ["planning", "building", "active", "strong"],
      default: "planning"
    },
    pillarPageUrl: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
contentClusterSchema.index({ projectId: 1 })
contentClusterSchema.index({ projectId: 1, status: 1 })

let ContentClusterModel: Model<ContentCluster>
try {
  ContentClusterModel = mongoose.model<ContentCluster>("ContentCluster")
} catch {
  ContentClusterModel = mongoose.model<ContentCluster>("ContentCluster", contentClusterSchema)
}

export { ContentClusterModel }
