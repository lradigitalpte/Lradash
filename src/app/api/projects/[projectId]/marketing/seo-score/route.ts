import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { SEORecommendationModel } from "@/models/seo-recommendation.model"

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

    // Fetch all recommendations for the project
    const recommendations = await SEORecommendationModel.find({ projectId }).lean()

    // Calculate scores based on recommendation status
    const totalRecommendations = recommendations.length
    const completedRecommendations = recommendations.filter(
      (r) => r.status === "completed" || r.status === "converted-to-task"
    ).length

    // Category breakdown
    const categories = {
      "on-page": { total: 0, completed: 0 },
      technical: { total: 0, completed: 0 },
      content: { total: 0, completed: 0 },
      experience: { total: 0, completed: 0 }
    }

    recommendations.forEach((r) => {
      categories[r.category].total++
      if (r.status === "completed" || r.status === "converted-to-task") {
        categories[r.category].completed++
      }
    })

    // Calculate category scores (0-100)
    const onPageScore =
      categories["on-page"].total > 0
        ? Math.round((categories["on-page"].completed / categories["on-page"].total) * 100)
        : 100
    const technicalScore =
      categories.technical.total > 0
        ? Math.round((categories.technical.completed / categories.technical.total) * 100)
        : 100
    const contentScore =
      categories.content.total > 0
        ? Math.round((categories.content.completed / categories.content.total) * 100)
        : 100

    // Overall score (weighted average)
    const overallScore = Math.round(onPageScore * 0.35 + technicalScore * 0.35 + contentScore * 0.3)

    return NextResponse.json(
      {
        overallScore,
        categories: {
          onPage: onPageScore,
          technical: technicalScore,
          content: contentScore
        },
        stats: {
          totalRecommendations,
          completedRecommendations,
          pendingRecommendations: totalRecommendations - completedRecommendations
        }
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get SEO score error:", error)
    return NextResponse.json(
      { error: "Failed to calculate SEO score" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
