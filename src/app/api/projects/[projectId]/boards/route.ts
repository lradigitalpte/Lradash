import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
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

    await connectToDatabase()

    const boards = await BoardModel.find({
      projectId: projectId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })
      .populate("owner", "name email")
      .lean()

    return NextResponse.json(
      boards.map((b) => ({
        id: b._id.toString(),
        title: b.title,
        description: b.description,
        projectId: b.projectId?.toString(),
        owner: b.owner,
        isArchived: b.isArchived,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get boards error:", error)
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || !decoded.organizationId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const board = await BoardModel.create({
      title,
      description: description || "",
      projectId: projectId,
      organizationId: decoded.organizationId,
      owner: decoded.userId
    } as any)

    return NextResponse.json(
      {
        id: board._id.toString(),
        title: board.title,
        description: board.description,
        projectId: board.projectId?.toString(),
        owner: decoded.userId
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create board error:", error)
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
