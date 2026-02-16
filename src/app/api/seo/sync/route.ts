import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { syncSEOData } from "@/lib/seo/data-sync"

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
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Sync SEO data from Google Search Console
    const result = await syncSEOData(projectId)

    return NextResponse.json(
      {
        ...result,
        message: result.success
          ? "SEO data synced successfully"
          : "SEO data sync completed with errors"
      },
      {
        status: result.success ? 200 : 207, // 207 Multi-Status for partial success
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Sync SEO data error:", error)
    return NextResponse.json(
      {
        error: "Failed to sync SEO data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
