import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ContentClusterModel } from "@/models/content-cluster.model"

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

    const clusters = await ContentClusterModel.find({ projectId }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      clusters.map((c) => ({
        id: c._id.toString(),
        projectId: c.projectId.toString(),
        name: c.name,
        subtopics: c.subtopics,
        authorityScore: c.authorityScore,
        status: c.status,
        pillarPageUrl: c.pillarPageUrl,
        createdBy: c.createdBy.toString(),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get clusters error:", error)
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
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
    const { name, subtopics, pillarPageUrl } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const cluster = await ContentClusterModel.create({
      projectId,
      name,
      subtopics: subtopics || [],
      pillarPageUrl,
      createdBy: decoded.userId
    })

    return NextResponse.json(
      {
        id: cluster._id.toString(),
        projectId: cluster.projectId.toString(),
        name: cluster.name,
        subtopics: cluster.subtopics,
        authorityScore: cluster.authorityScore,
        status: cluster.status,
        pillarPageUrl: cluster.pillarPageUrl,
        createdBy: cluster.createdBy.toString(),
        createdAt: cluster.createdAt,
        updatedAt: cluster.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create cluster error:", error)
    return NextResponse.json(
      { error: "Failed to create cluster" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PUT(
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
    const { clusterId, name, subtopics, authorityScore, status, pillarPageUrl } = body

    if (!clusterId) {
      return NextResponse.json(
        { error: "clusterId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name
    }
    if (subtopics !== undefined) {
      updateData.subtopics = subtopics
    }
    if (authorityScore !== undefined) {
      updateData.authorityScore = authorityScore
    }
    if (status !== undefined) {
      updateData.status = status
    }
    if (pillarPageUrl !== undefined) {
      updateData.pillarPageUrl = pillarPageUrl
    }

    const cluster = await ContentClusterModel.findOneAndUpdate(
      { _id: clusterId, projectId },
      updateData,
      { new: true }
    )

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: cluster._id.toString(),
        projectId: cluster.projectId.toString(),
        name: cluster.name,
        subtopics: cluster.subtopics,
        authorityScore: cluster.authorityScore,
        status: cluster.status,
        pillarPageUrl: cluster.pillarPageUrl,
        createdAt: cluster.createdAt,
        updatedAt: cluster.updatedAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Update cluster error:", error)
    return NextResponse.json(
      { error: "Failed to update cluster" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url)
    const clusterId = searchParams.get("clusterId")

    if (!clusterId) {
      return NextResponse.json(
        { error: "clusterId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const result = await ContentClusterModel.deleteOne({ _id: clusterId, projectId })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Delete cluster error:", error)
    return NextResponse.json(
      { error: "Failed to delete cluster" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
