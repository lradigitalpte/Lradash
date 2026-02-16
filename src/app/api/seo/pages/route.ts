import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { SEOPageModel } from "@/models/seo-page.model"

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
    const sortBy = searchParams.get("sortBy") || "searchConsole.clicks"
    const sortOrder = searchParams.get("sortOrder") || "-1"
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const isIndexed = searchParams.get("isIndexed")

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Build query
    const query: any = { projectId }

    if (isIndexed !== undefined && isIndexed !== null) {
      query["technical.isIndexed"] = isIndexed === "true"
    }

    // Build sort object
    const sort: any = {}
    sort[sortBy] = parseInt(sortOrder)

    // Fetch pages with pagination
    const pages = await SEOPageModel.find(query).sort(sort).skip(offset).limit(limit).lean()

    // Get total count for pagination
    const total = await SEOPageModel.countDocuments(query)

    return NextResponse.json(
      {
        pages: pages.map((p) => ({
          id: p._id.toString(),
          projectId: p.projectId.toString(),
          url: p.url,
          title: p.title,
          description: p.description,
          searchConsole: p.searchConsole,
          technical: p.technical,
          onPage: p.onPage,
          performance: p.performance,
          backlinks: p.backlinks,
          recommendations: p.recommendations,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + pages.length < total
        }
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get SEO pages error:", error)
    return NextResponse.json(
      { error: "Failed to fetch SEO pages" },
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
      url,
      title,
      description,
      searchConsole,
      technical,
      onPage,
      performance,
      backlinks,
      recommendations
    } = body

    if (!projectId || !url) {
      return NextResponse.json(
        { error: "projectId and url are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Check if page already exists
    const existingPage = await SEOPageModel.findOne({
      projectId,
      url
    })

    let pageDoc

    if (existingPage) {
      // Update existing page
      pageDoc = await SEOPageModel.findByIdAndUpdate(
        existingPage._id,
        {
          title,
          description,
          searchConsole,
          technical,
          onPage,
          performance,
          backlinks,
          recommendations
        },
        { new: true }
      )
    } else {
      // Create new page
      pageDoc = await SEOPageModel.create({
        projectId,
        url,
        title,
        description,
        searchConsole,
        technical,
        onPage,
        performance,
        backlinks,
        recommendations
      })
    }

    if (!pageDoc) {
      return NextResponse.json(
        { error: "Failed to create or update page" },
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: pageDoc._id.toString(),
        projectId: pageDoc.projectId.toString(),
        url: pageDoc.url,
        title: pageDoc.title,
        description: pageDoc.description,
        searchConsole: pageDoc.searchConsole,
        technical: pageDoc.technical,
        onPage: pageDoc.onPage,
        performance: pageDoc.performance,
        backlinks: pageDoc.backlinks,
        recommendations: pageDoc.recommendations,
        createdAt: pageDoc.createdAt,
        updatedAt: pageDoc.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create SEO page error:", error)
    return NextResponse.json(
      { error: "Failed to create SEO page" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
