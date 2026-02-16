import mongoose, { Model } from "mongoose"

export interface SEOKeyword {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  keyword: string
  searchVolume?: number
  difficulty?: number
  currentPosition: number
  previousPosition?: number
  searchConsole?: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    lastUpdated: Date
  }
  trend: "up" | "down" | "stable"
  lastUpdated: Date
  history: Array<{
    date: Date
    position: number
    clicks: number
    impressions: number
    ctr: number
  }>
  tags: string[]
  targetUrl?: string
  competitorPositions: Array<{
    domain: string
    position: number
  }>
  createdAt: Date
  updatedAt: Date
}

const seoKeywordSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    keyword: {
      type: String,
      required: true,
      trim: true
    },
    searchVolume: { type: Number, min: 0 },
    difficulty: {
      type: Number,
      min: 0,
      max: 100
    },
    currentPosition: {
      type: Number,
      required: true,
      min: 1
    },
    previousPosition: {
      type: Number,
      min: 1
    },
    searchConsole: {
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      position: { type: Number, min: 1 },
      lastUpdated: { type: Date, default: Date.now }
    },
    trend: {
      type: String,
      enum: ["up", "down", "stable"],
      default: "stable"
    },
    lastUpdated: { type: Date, default: Date.now },
    history: [
      {
        date: { type: Date, required: true },
        position: { type: Number, required: true },
        clicks: { type: Number, default: 0 },
        impressions: { type: Number, default: 0 },
        ctr: { type: Number, default: 0 }
      }
    ],
    tags: [{ type: String }],
    targetUrl: { type: String },
    competitorPositions: [
      {
        domain: { type: String, required: true },
        position: { type: Number, required: true, min: 1 }
      }
    ]
  },
  {
    timestamps: true
  }
)

// Indexes for performance
seoKeywordSchema.index({ projectId: 1, keyword: 1 }, { unique: true })
seoKeywordSchema.index({ projectId: 1, currentPosition: 1 })
seoKeywordSchema.index({ projectId: 1, tags: 1 })
seoKeywordSchema.index({ projectId: 1, lastUpdated: -1 })

// Pre-save hook to calculate trend
seoKeywordSchema.pre("save", function (this: any, next: any) {
  if (this.previousPosition) {
    if (this.currentPosition < this.previousPosition) {
      this.trend = "up"
    } else if (this.currentPosition > this.previousPosition) {
      this.trend = "down"
    } else {
      this.trend = "stable"
    }
  }
  next()
})

let SEOKeywordModel: Model<SEOKeyword>
try {
  SEOKeywordModel = mongoose.model<SEOKeyword>("SEOKeyword")
} catch {
  SEOKeywordModel = mongoose.model<SEOKeyword>("SEOKeyword", seoKeywordSchema)
}

export { SEOKeywordModel }
