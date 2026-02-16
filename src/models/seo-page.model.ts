import mongoose, { Model } from "mongoose"

export interface SEOPage {
  _id: mongoose.Types.ObjectId
  projectId: mongoose.Types.ObjectId
  url: string
  title?: string
  description?: string

  // Search Console Data
  searchConsole: {
    clicks: number
    impressions: number
    ctr: number
    position: number
    lastUpdated: Date
  }

  // Technical SEO
  technical: {
    isIndexed: boolean
    canonicalUrl?: string
    lastCrawled?: Date
    crawlErrors: number
    coreWebVitals?: {
      lcp: "good" | "needs-improvement" | "poor"
      fid: "good" | "needs-improvement" | "poor"
      cls: "good" | "needs-improvement" | "poor"
    }
  }

  // On-Page SEO
  onPage: {
    titleLength?: number
    descriptionLength?: number
    h1Count?: number
    h2Count?: number
    wordCount?: number
    internalLinks?: number
    externalLinks?: number
    imageCount?: number
    imagesWithAlt?: number
    hasSchema: boolean
  }

  // Content Performance
  performance: {
    organicTraffic: number
    bounceRate?: number
    avgTimeOnPage?: number
    conversions?: number
    revenue?: number
    lastUpdated: Date
  }

  // Backlinks
  backlinks: {
    total: number
    uniqueDomains: number
    referringPages: number
    lastUpdated: Date
  }

  // Recommendations
  recommendations: Array<{
    type: "title" | "meta" | "content" | "technical" | "performance"
    severity: "high" | "medium" | "low"
    message: string
    createdAt: Date
  }>

  createdAt: Date
  updatedAt: Date
}

const seoPageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    url: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    title: { type: String },
    description: { type: String },
    searchConsole: {
      clicks: { type: Number, default: 0 },
      impressions: { type: Number, default: 0 },
      ctr: { type: Number, default: 0 },
      position: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    technical: {
      isIndexed: { type: Boolean, default: true },
      canonicalUrl: { type: String },
      lastCrawled: { type: Date },
      crawlErrors: { type: Number, default: 0 },
      coreWebVitals: {
        lcp: {
          type: String,
          enum: ["good", "needs-improvement", "poor"]
        },
        fid: {
          type: String,
          enum: ["good", "needs-improvement", "poor"]
        },
        cls: {
          type: String,
          enum: ["good", "needs-improvement", "poor"]
        }
      }
    },
    onPage: {
      titleLength: { type: Number, min: 0 },
      descriptionLength: { type: Number, min: 0 },
      h1Count: { type: Number, min: 0 },
      h2Count: { type: Number, min: 0 },
      wordCount: { type: Number, min: 0 },
      internalLinks: { type: Number, min: 0 },
      externalLinks: { type: Number, min: 0 },
      imageCount: { type: Number, min: 0 },
      imagesWithAlt: { type: Number, min: 0 },
      hasSchema: { type: Boolean, default: false }
    },
    performance: {
      organicTraffic: { type: Number, default: 0 },
      bounceRate: { type: Number, min: 0, max: 100 },
      avgTimeOnPage: { type: Number, min: 0 },
      conversions: { type: Number, default: 0 },
      revenue: { type: Number, min: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    backlinks: {
      total: { type: Number, default: 0 },
      uniqueDomains: { type: Number, default: 0 },
      referringPages: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    recommendations: [
      {
        type: {
          type: String,
          enum: ["title", "meta", "content", "technical", "performance"],
          required: true
        },
        severity: {
          type: String,
          enum: ["high", "medium", "low"],
          required: true
        },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true
  }
)

// Indexes for performance
seoPageSchema.index({ projectId: 1, url: 1 })
seoPageSchema.index({ projectId: 1, "searchConsole.clicks": -1 })
seoPageSchema.index({ projectId: 1, "technical.isIndexed": 1 })
seoPageSchema.index({ projectId: 1, "performance.organicTraffic": -1 })

let SEOPageModel: Model<SEOPage>
try {
  SEOPageModel = mongoose.model<SEOPage>("SEOPage")
} catch {
  SEOPageModel = mongoose.model<SEOPage>("SEOPage", seoPageSchema)
}

export { SEOPageModel }
