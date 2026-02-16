import { connectToDatabase } from "@/lib/db/connect"
import { SEOAlertModel } from "@/models/seo-alert.model"
import { SEOKeywordModel } from "@/models/seo-keyword.model"
import { SEOMetricsModel } from "@/models/seo-metrics.model"
import { SEOPageModel } from "@/models/seo-page.model"

export interface SEOReportConfig {
  projectId: string
  name: string
  dateRange: {
    start: Date
    end: Date
  }
  sections: string[]
  format: "pdf" | "html" | "csv"
}

export interface SEOReportData {
  overview: {
    seoHealth: number
    totalClicks: number
    totalImpressions: number
    averageCTR: number
    averagePosition: number
  }
  performance: {
    traffic: {
      organic: number
      direct: number
      referral: number
      social: number
    }
    keywords: {
      total: number
      inTop3: number
      inTop10: number
    }
    pages: {
      topPages: Array<{
        url: string
        clicks: number
        impressions: number
        ctr: number
      }>
    }
  }
  technical: {
    indexedPages: number
    crawlErrors: number
    coreWebVitals: {
      good: number
      needsImprovement: number
      poor: number
    }
  }
  recommendations: Array<{
    title: string
    description: string
    impact: string
    category: string
  }>
  trends: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
}

/**
 * Generate comprehensive SEO report
 */
export async function generateSEOReport(config: SEOReportConfig): Promise<SEOReportData> {
  await connectToDatabase()

  // Fetch metrics for the date range
  const metrics = await SEOMetricsModel.find({
    projectId: config.projectId,
    date: {
      $gte: config.dateRange.start,
      $lte: config.dateRange.end
    }
  })
    .sort({ date: -1 })
    .lean()

  // Calculate overview metrics
  const latestMetrics = metrics[0]
  const overview = {
    seoHealth: calculateSEOHealth(latestMetrics),
    totalClicks: latestMetrics?.searchConsole.totalClicks || 0,
    totalImpressions: latestMetrics?.searchConsole.totalImpressions || 0,
    averageCTR: latestMetrics?.searchConsole.averageCTR || 0,
    averagePosition: latestMetrics?.searchConsole.averagePosition || 0
  }

  // Fetch performance data
  const topKeywords = await SEOKeywordModel.find({ projectId: config.projectId })
    .sort({ currentPosition: 1 })
    .limit(10)
    .lean()

  const topPages = await SEOPageModel.find({ projectId: config.projectId })
    .sort({ "searchConsole.clicks": -1 })
    .limit(10)
    .lean()

  const performance = {
    traffic: latestMetrics?.traffic || {
      organic: 0,
      direct: 0,
      referral: 0,
      social: 0
    },
    keywords: {
      total: await SEOKeywordModel.countDocuments({ projectId: config.projectId }),
      inTop3: await SEOKeywordModel.countDocuments({
        projectId: config.projectId,
        currentPosition: { $lte: 3 }
      }),
      inTop10: await SEOKeywordModel.countDocuments({
        projectId: config.projectId,
        currentPosition: { $lte: 10 }
      })
    },
    pages: {
      topPages: topPages.map((p) => ({
        url: p.url,
        clicks: p.searchConsole.clicks,
        impressions: p.searchConsole.impressions,
        ctr: p.searchConsole.ctr
      }))
    }
  }

  // Fetch technical data
  const technical = latestMetrics?.technical || {
    indexedPages: 0,
    crawlErrors: 0,
    coreWebVitals: { good: 0, needsImprovement: 0, poor: 0 }
  }

  // Fetch recommendations (from existing SEO recommendation model)
  const { SEORecommendationModel } = await import("@/models/seo-recommendation.model")
  const recommendations = await SEORecommendationModel.find({
    projectId: config.projectId,
    status: "pending"
  })
    .limit(10)
    .lean()

  // Calculate trends
  const trends = calculateTrends(metrics)

  return {
    overview,
    performance,
    technical,
    recommendations: recommendations.map((r) => ({
      title: r.title,
      description: r.description,
      impact: r.impact,
      category: r.category
    })),
    trends
  }
}

/**
 * Calculate SEO health score
 */
function calculateSEOHealth(metrics: any): number {
  if (!metrics) {
    return 0
  }

  const technicalScore = calculateTechnicalScore(metrics.technical)
  const performanceScore = calculatePerformanceScore(metrics.searchConsole)
  const contentScore = calculateContentScore(metrics.keywords)

  // Weighted average
  return Math.round(technicalScore * 0.35 + performanceScore * 0.35 + contentScore * 0.3)
}

/**
 * Calculate technical SEO score
 */
function calculateTechnicalScore(technical: any): number {
  if (!technical) {
    return 0
  }

  const indexedScore = technical.indexedPages > 0 ? 100 : 0
  const errorScore =
    technical.crawlErrors === 0 ? 100 : Math.max(0, 100 - technical.crawlErrors * 10)
  const webVitalsScore = technical.coreWebVitals?.good || 0

  return Math.round((indexedScore + errorScore + webVitalsScore) / 3)
}

/**
 * Calculate performance score
 */
function calculatePerformanceScore(searchConsole: any): number {
  if (!searchConsole || searchConsole.impressions === 0) {
    return 0
  }

  const ctrScore = Math.min(100, searchConsole.ctr * 10)
  const positionScore = Math.max(0, 100 - searchConsole.averagePosition * 5)

  return Math.round((ctrScore + positionScore) / 2)
}

/**
 * Calculate content score
 */
function calculateContentScore(keywords: any): number {
  if (!keywords) {
    return 0
  }

  const top3Ratio = keywords.inTop3 / (keywords.total || 1)
  const top10Ratio = keywords.inTop10 / (keywords.total || 1)

  return Math.round((top3Ratio * 100 + top10Ratio * 50) / 2)
}

/**
 * Calculate trends between periods
 */
function calculateTrends(metrics: any[]): any {
  if (metrics.length < 2) {
    return { clicks: 0, impressions: 0, ctr: 0, position: 0 }
  }

  const current = metrics[0]
  const previous = metrics[1]

  return {
    clicks: calculatePercentageChange(
      previous.searchConsole.totalClicks,
      current.searchConsole.totalClicks
    ),
    impressions: calculatePercentageChange(
      previous.searchConsole.totalImpressions,
      current.searchConsole.totalImpressions
    ),
    ctr: calculatePercentageChange(
      previous.searchConsole.averageCTR,
      current.searchConsole.averageCTR
    ),
    position: calculatePercentageChange(
      previous.searchConsole.averagePosition,
      current.searchConsole.averagePosition
    )
  }
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) {
    return 0
  }
  return ((current - previous) / previous) * 100
}

/**
 * Check if any SEO alerts should be triggered
 */
export async function checkSEOAlerts(projectId: string): Promise<void> {
  await connectToDatabase()

  const alerts = await SEOAlertModel.find({
    projectId,
    isActive: true
  }).lean()

  const latestMetrics = await SEOMetricsModel.findOne({ projectId }).sort({ date: -1 }).lean()

  if (!latestMetrics) {
    return
  }

  for (const alert of alerts) {
    let shouldTrigger = false

    for (const condition of alert.conditions) {
      const metricValue = getMetricValue(latestMetrics, condition.metric)

      switch (condition.operator) {
        case "gt":
          shouldTrigger = metricValue > condition.value
          break
        case "lt":
          shouldTrigger = metricValue < condition.value
          break
        case "gte":
          shouldTrigger = metricValue >= condition.value
          break
        case "lte":
          shouldTrigger = metricValue <= condition.value
          break
        case "eq":
          shouldTrigger = metricValue === condition.value
          break
      }

      if (shouldTrigger) {
        break
      }
    }

    if (shouldTrigger) {
      // TODO: Send notification based on alert.notificationChannels
      // Update alert lastTriggered
      await SEOAlertModel.findByIdAndUpdate(alert._id, {
        $inc: { triggerCount: 1 },
        lastTriggered: new Date()
      })
    }
  }
}

/**
 * Get metric value from SEO metrics object
 */
function getMetricValue(metrics: any, metricPath: string): number {
  const parts = metricPath.split(".")
  let value: any = metrics

  for (const part of parts) {
    value = value?.[part]
  }

  return typeof value === "number" ? value : 0
}

/**
 * Schedule automated report generation
 */
export async function scheduleReport(
  projectId: string,
  reportName: string,
  frequency: "daily" | "weekly" | "monthly",
  notificationChannels: string[]
): Promise<void> {
  await connectToDatabase()

  // TODO: Implement job scheduling (using cron, node-schedule, or similar)
  // This would create a recurring job that:
  // 1. Generates the report at the specified interval
  // 2. Sends notifications via configured channels
  // 3. Stores the report for future reference

  console.log(`Scheduled report: ${reportName} for project ${projectId} at ${frequency} frequency`)
}
