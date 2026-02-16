import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { generateSEOReport } from "@/lib/seo/report-generator"

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
    const { projectId, name, startDate, endDate, sections, format } = body

    if (!projectId || !name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "projectId, name, startDate, and endDate are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Generate report data
    const reportData = await generateSEOReport({
      projectId,
      name,
      dateRange: {
        start: new Date(startDate),
        end: new Date(endDate)
      },
      sections: sections || ["overview", "performance", "technical", "recommendations", "trends"],
      format: format || "html"
    })

    return NextResponse.json(
      {
        reportData,
        generatedAt: new Date(),
        reportId: `report_${Date.now()}_${projectId}`
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Generate SEO report error:", error)
    return NextResponse.json(
      { error: "Failed to generate SEO report" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
