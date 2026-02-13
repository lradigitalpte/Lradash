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

    const recommendations = await SEORecommendationModel.find({
      projectId
    })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(
      recommendations.map((r) => ({
        id: r._id.toString(),
        projectId: r.projectId.toString(),
        title: r.title,
        description: r.description,
        category: r.category,
        impact: r.impact,
        difficulty: r.difficulty,
        status: r.status,
        taskId: r.taskId?.toString(),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get recommendations error:", error)
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(
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
    const body = await request.json()
    const { title, description, category, impact, difficulty } = body

    if (!title || !description || !category || !impact || !difficulty) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const recommendation = await SEORecommendationModel.create({
      projectId,
      title,
      description,
      category,
      impact,
      difficulty
    })

    return NextResponse.json(
      {
        id: recommendation._id.toString(),
        projectId: recommendation.projectId.toString(),
        title: recommendation.title,
        description: recommendation.description,
        category: recommendation.category,
        impact: recommendation.impact,
        difficulty: recommendation.difficulty,
        status: recommendation.status,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create recommendation error:", error)
    return NextResponse.json(
      { error: "Failed to create recommendation" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PATCH(
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
    const body = await request.json()
    const { recommendationId, status, taskId } = body

    if (!recommendationId || !status) {
      return NextResponse.json(
        { error: "Missing recommendationId or status" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const updateData: any = { status }
    if (taskId) {
      updateData.taskId = taskId
    }

    const recommendation = await SEORecommendationModel.findOneAndUpdate(
      { _id: recommendationId, projectId },
      updateData,
      { new: true }
    )

    if (!recommendation) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: recommendation._id.toString(),
        status: recommendation.status,
        taskId: recommendation.taskId?.toString()
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Update recommendation error:", error)
    return NextResponse.json(
      { error: "Failed to update recommendation" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
