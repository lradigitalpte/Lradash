import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { GoogleConnectionModel } from "@/models/google-connection.model"

// This endpoint returns mock Search Console data
// In production, you would call the Google Search Console API
// using the stored access token

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    const { projectId } = await params

    await connectToDatabase()

    // Check if Google is connected
    const connection = await GoogleConnectionModel.findOne({ projectId, isActive: true }).lean()

    if (!connection) {
      return NextResponse.json(
        { error: "Google Search Console not connected" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // TODO: In production, use connection.accessToken to call Google Search Console API
    // For now, return mock data
    const mockData = {
      overview: {
        totalClicks: 12847,
        totalImpressions: 284392,
        averageCTR: 4.52,
        averagePosition: 8.3,
        trend: {
          clicks: 12.4,
          impressions: 8.7,
          ctr: 2.1,
          position: -5.2
        }
      },
      topQueries: [
        {
          query: "project management software",
          clicks: 1247,
          impressions: 18392,
          ctr: 6.78,
          position: 3.2
        },
        {
          query: "kanban board tool",
          clicks: 892,
          impressions: 12847,
          ctr: 6.94,
          position: 4.1
        },
        {
          query: "agile project tracking",
          clicks: 743,
          impressions: 9284,
          ctr: 8.0,
          position: 2.8
        },
        {
          query: "team collaboration platform",
          clicks: 621,
          impressions: 14392,
          ctr: 4.31,
          position: 7.2
        },
        {
          query: "scrum board online",
          clicks: 534,
          impressions: 8291,
          ctr: 6.44,
          position: 5.3
        }
      ],
      topPages: [
        {
          page: "/features/kanban",
          clicks: 2847,
          impressions: 42391,
          ctr: 6.72,
          position: 3.4
        },
        {
          page: "/pricing",
          clicks: 1923,
          impressions: 28472,
          ctr: 6.75,
          position: 4.2
        },
        {
          page: "/blog/agile-workflows",
          clicks: 1472,
          impressions: 19283,
          ctr: 7.63,
          position: 2.9
        }
      ],
      lastSynced: connection.lastSyncedAt || new Date()
    }

    return NextResponse.json(mockData, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get Search Console data error:", error)
    return NextResponse.json(
      { error: "Failed to fetch Search Console data" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
