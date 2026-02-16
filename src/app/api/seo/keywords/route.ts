import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { SEOKeywordModel } from "@/models/seo-keyword.model"

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
    const tag = searchParams.get("tag")
    const trend = searchParams.get("trend")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Build query
    const query: any = { projectId }

    if (tag) {
      query.tags = tag
    }

    if (trend) {
      query.trend = trend
    }

    // Fetch keywords with pagination
    const keywords = await SEOKeywordModel.find(query)
      .sort({ lastUpdated: -1 })
      .skip(offset)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const total = await SEOKeywordModel.countDocuments(query)

    return NextResponse.json(
      {
        keywords: keywords.map((k) => ({
          id: k._id.toString(),
          projectId: k.projectId.toString(),
          keyword: k.keyword,
          searchVolume: k.searchVolume,
          difficulty: k.difficulty,
          currentPosition: k.currentPosition,
          previousPosition: k.previousPosition,
          trend: k.trend,
          lastUpdated: k.lastUpdated,
          history: k.history,
          tags: k.tags,
          targetUrl: k.targetUrl,
          competitorPositions: k.competitorPositions,
          createdAt: k.createdAt,
          updatedAt: k.updatedAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + keywords.length < total
        }
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get SEO keywords error:", error)
    return NextResponse.json(
      { error: "Failed to fetch SEO keywords" },
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
      keyword,
      searchVolume,
      difficulty,
      currentPosition,
      previousPosition,
      tags,
      targetUrl,
      competitorPositions
    } = body

    if (!projectId || !keyword || !currentPosition) {
      return NextResponse.json(
        { error: "projectId, keyword, and currentPosition are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Check if keyword already exists
    const existingKeyword = await SEOKeywordModel.findOne({
      projectId,
      keyword: keyword.toLowerCase()
    })

    let keywordDoc

    if (existingKeyword) {
      // Update existing keyword
      keywordDoc = await SEOKeywordModel.findByIdAndUpdate(
        existingKeyword._id,
        {
          previousPosition: existingKeyword.currentPosition,
          currentPosition,
          searchVolume,
          difficulty,
          tags,
          targetUrl,
          competitorPositions,
          lastUpdated: new Date()
        },
        { new: true }
      )
    } else {
      // Create new keyword
      keywordDoc = await SEOKeywordModel.create({
        projectId,
        keyword: keyword.toLowerCase(),
        searchVolume,
        difficulty,
        currentPosition,
        previousPosition,
        tags,
        targetUrl,
        competitorPositions
      })
    }

    if (!keywordDoc) {
      return NextResponse.json(
        { error: "Failed to create or update keyword" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: keywordDoc._id.toString(),
        projectId: keywordDoc.projectId.toString(),
        keyword: keywordDoc.keyword,
        searchVolume: keywordDoc.searchVolume,
        difficulty: keywordDoc.difficulty,
        currentPosition: keywordDoc.currentPosition,
        previousPosition: keywordDoc.previousPosition,
        trend: keywordDoc.trend,
        lastUpdated: keywordDoc.lastUpdated,
        history: keywordDoc.history,
        tags: keywordDoc.tags,
        targetUrl: keywordDoc.targetUrl,
        competitorPositions: keywordDoc.competitorPositions,
        createdAt: keywordDoc.createdAt,
        updatedAt: keywordDoc.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create SEO keyword error:", error)
    return NextResponse.json(
      { error: "Failed to create SEO keyword" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
