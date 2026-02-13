import mongoose, { Model } from "mongoose"

export interface SEORecommendation {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  title: string
  description: string
  category: "on-page" | "technical" | "content" | "experience"
  impact: "high" | "medium" | "low"
  difficulty: "easy" | "medium" | "hard"
  status: "pending" | "in-progress" | "completed" | "ignored" | "converted-to-task"
  taskId?: mongoose.Types.ObjectId // Reference to created task if converted
  createdAt: Date
  updatedAt: Date
}

const seoRecommendationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["on-page", "technical", "content", "experience"],
      required: true
    },
    impact: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "ignored", "converted-to-task"],
      default: "pending"
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: false
    }
  },
  {
    timestamps: true
  }
)

// Indexes for performance
seoRecommendationSchema.index({ projectId: 1 })
seoRecommendationSchema.index({ projectId: 1, status: 1 })
seoRecommendationSchema.index({ projectId: 1, category: 1 })

let SEORecommendationModel: Model<SEORecommendation>
try {
  SEORecommendationModel = mongoose.model<SEORecommendation>("SEORecommendation")
} catch {
  SEORecommendationModel = mongoose.model<SEORecommendation>(
    "SEORecommendation",
    seoRecommendationSchema
  )
}

export { SEORecommendationModel }
