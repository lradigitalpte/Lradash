import { connectToDatabase } from "@/lib/db/connect"
import { GoogleConnectionModel } from "@/models/google-connection.model"
import { SEOKeywordModel } from "@/models/seo-keyword.model"
import { SEOMetricsModel } from "@/models/seo-metrics.model"
import { SEOPageModel } from "@/models/seo-page.model"

import {
  getActiveConnection,
  getSearchAnalytics,
  getTopQueries,
  getTopPages,
  inspectUrl
} from "./google-search-console"
import { checkSEOAlerts } from "./report-generator"

/**
 * Sync SEO data from Google Search Console
 */
export async function syncSEOData(projectId: string): Promise<{
  success: boolean
  metricsSynced: number
  keywordsSynced: number
  pagesSynced: number
  errors: string[]
}> {
  try {
    const errors: string[] = []
    let metricsSynced = 0
    let keywordsSynced = 0
    let pagesSynced = 0

    // Check if Google Search Console is connected
    await connectToDatabase()
    const connection = await GoogleConnectionModel.findOne({
      projectId,
      isActive: true
    })

    if (!connection) {
      errors.push("Google Search Console not connected")
      return { success: false, metricsSynced: 0, keywordsSynced: 0, pagesSynced: 0, errors }
    }

    const siteUrl = connection.propertyUrl

    // Calculate date ranges
    const today = new Date()
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setDate(lastMonth.getDate() - 30)

    // Sync daily metrics
    try {
      const dailyData = await getSearchAnalytics(projectId, {
        siteUrl,
        startDate: lastWeek.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        dimensions: ["date"]
      })

      if (dailyData.rows && dailyData.rows.length > 0) {
        for (const row of dailyData.rows) {
          const date = new Date(row.keys[0])

          await SEOMetricsModel.findOneAndUpdate(
            {
              projectId,
              date,
              period: "daily"
            },
            {
              projectId,
              date,
              period: "daily",
              searchConsole: {
                totalClicks: row.clicks,
                totalImpressions: row.impressions,
                averageCTR: row.ctr,
                averagePosition: row.position
              }
            },
            { upsert: true, new: true }
          )
          metricsSynced++
        }
      }
    } catch (error) {
      errors.push(
        `Failed to sync daily metrics: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Sync weekly metrics
    try {
      const weeklyData = await getSearchAnalytics(projectId, {
        siteUrl,
        startDate: lastMonth.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        dimensions: ["date"]
      })

      if (weeklyData.rows && weeklyData.rows.length > 0) {
        const aggregatedData = aggregateByWeek(weeklyData.rows)

        for (const weekData of aggregatedData) {
          await SEOMetricsModel.findOneAndUpdate(
            {
              projectId,
              date: weekData.date,
              period: "weekly"
            },
            {
              projectId,
              date: weekData.date,
              period: "weekly",
              searchConsole: weekData.searchConsole
            },
            { upsert: true, new: true }
          )
          metricsSynced++
        }
      }
    } catch (error) {
      errors.push(
        `Failed to sync weekly metrics: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Sync monthly metrics
    try {
      const monthlyData = await getSearchAnalytics(projectId, {
        siteUrl,
        startDate: lastMonth.toISOString().split("T")[0],
        endDate: today.toISOString().split("T")[0],
        dimensions: ["date"]
      })

      if (monthlyData.rows && monthlyData.rows.length > 0) {
        const aggregatedData = aggregateByMonth(monthlyData.rows)

        for (const monthData of aggregatedData) {
          await SEOMetricsModel.findOneAndUpdate(
            {
              projectId,
              date: monthData.date,
              period: "monthly"
            },
            {
              projectId,
              date: monthData.date,
              period: "monthly",
              searchConsole: monthData.searchConsole
            },
            { upsert: true, new: true }
          )
          metricsSynced++
        }
      }
    } catch (error) {
      errors.push(
        `Failed to sync monthly metrics: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Sync top keywords
    try {
      const keywordsData = await getTopQueries(
        projectId,
        siteUrl,
        lastWeek.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
        100
      )

      if (keywordsData.rows && keywordsData.rows.length > 0) {
        for (const row of keywordsData.rows) {
          const keyword = row.keys[0]

          const existingKeyword = await SEOKeywordModel.findOne({ projectId, keyword })

          if (existingKeyword) {
            // Update existing keyword
            await SEOKeywordModel.findByIdAndUpdate(existingKeyword._id, {
              previousPosition: existingKeyword.currentPosition,
              currentPosition: row.position,
              searchConsole: {
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr,
                position: row.position,
                lastUpdated: new Date()
              },
              history: [
                {
                  date: new Date(),
                  position: row.position,
                  clicks: row.clicks,
                  impressions: row.impressions,
                  ctr: row.ctr
                },
                ...existingKeyword.history.slice(0, 29) // Keep last 30 entries
              ]
            })
          } else {
            // Create new keyword
            await SEOKeywordModel.create({
              projectId,
              keyword,
              currentPosition: row.position,
              searchConsole: {
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr,
                position: row.position,
                lastUpdated: new Date()
              },
              history: [
                {
                  date: new Date(),
                  position: row.position,
                  clicks: row.clicks,
                  impressions: row.impressions,
                  ctr: row.ctr
                }
              ]
            })
          }
          keywordsSynced++
        }
      }
    } catch (error) {
      errors.push(
        `Failed to sync keywords: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    // Sync top pages
    try {
      const pagesData = await getTopPages(
        projectId,
        siteUrl,
        lastWeek.toISOString().split("T")[0],
        today.toISOString().split("T")[0],
        50
      )

      if (pagesData.rows && pagesData.rows.length > 0) {
        for (const row of pagesData.rows) {
          const url = row.keys[0]

          const existingPage = await SEOPageModel.findOne({ projectId, url })

          if (existingPage) {
            // Update existing page
            await SEOPageModel.findByIdAndUpdate(existingPage._id, {
              searchConsole: {
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr,
                position: row.position,
                lastUpdated: new Date()
              }
            })
          } else {
            // Create new page
            await SEOPageModel.create({
              projectId,
              url,
              searchConsole: {
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr,
                position: row.position,
                lastUpdated: new Date()
              }
            })
          }
          pagesSynced++
        }
      }
    } catch (error) {
      errors.push(`Failed to sync pages: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Update last synced timestamp
    await GoogleConnectionModel.findByIdAndUpdate(connection._id, { lastSyncedAt: new Date() })

    // Check for alerts
    try {
      await checkSEOAlerts(projectId)
    } catch (error) {
      errors.push(
        `Failed to check alerts: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    return {
      success: errors.length === 0,
      metricsSynced,
      keywordsSynced,
      pagesSynced,
      errors
    }
  } catch (error) {
    console.error("Sync SEO data error:", error)
    return {
      success: false,
      metricsSynced: 0,
      keywordsSynced: 0,
      pagesSynced: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    }
  }
}

/**
 * Aggregate daily data by week
 */
function aggregateByWeek(rows: any[]): Array<{
  date: Date
  searchConsole: {
    totalClicks: number
    totalImpressions: number
    averageCTR: number
    averagePosition: number
  }
}> {
  const weeklyData = new Map<string, any>()

  for (const row of rows) {
    const date = new Date(row.keys[0])
    const weekStart = getWeekStart(date)
    const weekKey = weekStart.toISOString().split("T")[0]

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        totalClicks: 0,
        totalImpressions: 0,
        totalCTR: 0,
        totalPosition: 0,
        count: 0
      })
    }

    const data = weeklyData.get(weekKey)
    data.totalClicks += row.clicks
    data.totalImpressions += row.impressions
    data.totalCTR += row.ctr
    data.totalPosition += row.position
    data.count++
  }

  return Array.from(weeklyData.entries()).map(([weekKey, data]) => ({
    date: new Date(weekKey),
    searchConsole: {
      totalClicks: data.totalClicks,
      totalImpressions: data.totalImpressions,
      averageCTR: data.totalCTR / data.count,
      averagePosition: data.totalPosition / data.count
    }
  }))
}

/**
 * Aggregate daily data by month
 */
function aggregateByMonth(rows: any[]): Array<{
  date: Date
  searchConsole: {
    totalClicks: number
    totalImpressions: number
    averageCTR: number
    averagePosition: number
  }
}> {
  const monthlyData = new Map<string, any>()

  for (const row of rows) {
    const date = new Date(row.keys[0])
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        totalClicks: 0,
        totalImpressions: 0,
        totalCTR: 0,
        totalPosition: 0,
        count: 0
      })
    }

    const data = monthlyData.get(monthKey)
    data.totalClicks += row.clicks
    data.totalImpressions += row.impressions
    data.totalCTR += row.ctr
    data.totalPosition += row.position
    data.count++
  }

  return Array.from(monthlyData.entries()).map(([monthKey, data]) => ({
    date: new Date(monthKey + "-01"),
    searchConsole: {
      totalClicks: data.totalClicks,
      totalImpressions: data.totalImpressions,
      averageCTR: data.totalCTR / data.count,
      averagePosition: data.totalPosition / data.count
    }
  }))
}

/**
 * Get week start date (Monday) for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Sync SEO data for all projects (cron job)
 */
export async function syncAllProjectsSEO(): Promise<{
  totalProjects: number
  successful: number
  failed: number
  errors: string[]
}> {
  try {
    await connectToDatabase()

    const connections = await GoogleConnectionModel.find({ isActive: true })

    let successful = 0
    let failed = 0
    const errors: string[] = []

    for (const connection of connections) {
      const result = await syncSEOData(connection.projectId.toString())

      if (result.success) {
        successful++
      } else {
        failed++
        errors.push(`Project ${connection.projectId}: ${result.errors.join(", ")}`)
      }
    }

    return {
      totalProjects: connections.length,
      successful,
      failed,
      errors
    }
  } catch (error) {
    console.error("Sync all projects SEO error:", error)
    return {
      totalProjects: 0,
      successful: 0,
      failed: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    }
  }
}
