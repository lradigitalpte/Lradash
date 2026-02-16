import mongoose, { Model } from "mongoose"

export interface SEOMetrics {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  date: Date
  period: "daily" | "weekly" | "monthly"

  // Search Performance Metrics
  searchConsole: {
    totalClicks: number
    totalImpressions: number
    averageCTR: number
    averagePosition: number
  }

  // Traffic Sources
  traffic: {
    organic: number
    direct: number
    referral: number
    social: number
    email: number
    paid: number
  }

  // Keyword Rankings
  keywords: {
    total: number
    inTop3: number
    inTop10: number
    inTop100: number
    avgPosition: number
  }

  // Technical SEO
  technical: {
    indexedPages: number
    crawlErrors: number
    coreWebVitals: {
      good: number
      needsImprovement: number
      poor: number
    }
  }

  // Backlinks
  backlinks: {
    total: number
    new: number
    lost: number
    domainScore: number
  }

  // Conversions
  conversions: {
    total: number
    fromOrganic: number
    rate: number
  }

  // Competitor Comparison
  competitors: {
    avgPosition: number
    topKeywords: number
    domainScore: number
  }

  createdAt: Date
  updatedAt: Date
}

const seoMetricsSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    date: { type: Date, required: true },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      required: true
    },
    searchConsole: {
      totalClicks: { type: Number, default: 0 },
      totalImpressions: { type: Number, default: 0 },
      averageCTR: { type: Number, default: 0 },
      averagePosition: { type: Number, default: 0 }
    },
    traffic: {
      organic: { type: Number, default: 0 },
      direct: { type: Number, default: 0 },
      referral: { type: Number, default: 0 },
      social: { type: Number, default: 0 },
      email: { type: Number, default: 0 },
      paid: { type: Number, default: 0 }
    },
    keywords: {
      total: { type: Number, default: 0 },
      inTop3: { type: Number, default: 0 },
      inTop10: { type: Number, default: 0 },
      inTop100: { type: Number, default: 0 },
      avgPosition: { type: Number, default: 0 }
    },
    technical: {
      indexedPages: { type: Number, default: 0 },
      crawlErrors: { type: Number, default: 0 },
      coreWebVitals: {
        good: { type: Number, default: 0 },
        needsImprovement: { type: Number, default: 0 },
        poor: { type: Number, default: 0 }
      }
    },
    backlinks: {
      total: { type: Number, default: 0 },
      new: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      domainScore: { type: Number, default: 0 }
    },
    conversions: {
      total: { type: Number, default: 0 },
      fromOrganic: { type: Number, default: 0 },
      rate: { type: Number, default: 0 }
    },
    competitors: {
      avgPosition: { type: Number, default: 0 },
      topKeywords: { type: Number, default: 0 },
      domainScore: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
)

// Compound index for efficient queries
seoMetricsSchema.index({ projectId: 1, date: -1, period: 1 })
seoMetricsSchema.index({ projectId: 1, period: 1, date: -1 })

let SEOMetricsModel: Model<SEOMetrics>
try {
  SEOMetricsModel = mongoose.model<SEOMetrics>("SEOMetrics")
} catch {
  SEOMetricsModel = mongoose.model<SEOMetrics>("SEOMetrics", seoMetricsSchema)
}

export { SEOMetricsModel }
