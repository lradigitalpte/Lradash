import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { SEOMetricsModel } from "@/models/seo-metrics.model"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const period = (searchParams.get("period") as "daily" | "weekly" | "monthly") || "daily"
    const limit = parseInt(searchParams.get("limit") || "30")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Fetch metrics for the specified period
    const metrics = await SEOMetricsModel.find({
      projectId,
      period
    })
      .sort({ date: -1 })
      .limit(limit)
      .lean()

    return NextResponse.json(
      metrics.map((m) => ({
        id: m._id.toString(),
        projectId: m.projectId.toString(),
        date: m.date,
        period: m.period,
        searchConsole: m.searchConsole,
        traffic: m.traffic,
        keywords: m.keywords,
        technical: m.technical,
        backlinks: m.backlinks,
        conversions: m.conversions,
        competitors: m.competitors,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get SEO metrics error:", error)
    return NextResponse.json(
      { error: "Failed to fetch SEO metrics" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const {
      projectId,
      date,
      period,
      searchConsole,
      traffic,
      keywords,
      technical,
      backlinks,
      conversions,
      competitors
    } = body

    if (!projectId || !date || !period) {
      return NextResponse.json(
        { error: "projectId, date, and period are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Check if metrics for this date/period already exist
    const existingMetrics = await SEOMetricsModel.findOne({
      projectId,
      date,
      period
    })

    let metrics

    if (existingMetrics) {
      // Update existing metrics
      metrics = await SEOMetricsModel.findByIdAndUpdate(
        existingMetrics._id,
        {
          searchConsole,
          traffic,
          keywords,
          technical,
          backlinks,
          conversions,
          competitors
        },
        { new: true }
      )
    } else {
      // Create new metrics
      metrics = await SEOMetricsModel.create({
        projectId,
        date: new Date(date),
        period,
        searchConsole,
        traffic,
        keywords,
        technical,
        backlinks,
        conversions,
        competitors
      })
    }

    if (!metrics) {
      return NextResponse.json(
        { error: "Failed to create or update metrics" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: metrics._id.toString(),
        projectId: metrics.projectId.toString(),
        date: metrics.date,
        period: metrics.period,
        searchConsole: metrics.searchConsole,
        traffic: metrics.traffic,
        keywords: metrics.keywords,
        technical: metrics.technical,
        backlinks: metrics.backlinks,
        conversions: metrics.conversions,
        competitors: metrics.competitors,
        createdAt: metrics.createdAt,
        updatedAt: metrics.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create SEO metrics error:", error)
    return NextResponse.json(
      { error: "Failed to create SEO metrics" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
