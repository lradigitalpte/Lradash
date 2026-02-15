import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ListModel } from "@/models/list.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
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

    // Check if board exists and user has access
    const board = await BoardModel.findOne({
      _id: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const lists = await ListModel.find({
      boardId: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })
      .sort({ position: 1 })
      .populate("cardIds")
      .lean()

    return NextResponse.json(
      lists.map((l) => ({
        id: l._id.toString(),
        title: l.title,
        description: l.description,
        boardId: l.boardId.toString(),
        projectId: l.projectId.toString(),
        position: l.position,
        cardIds: l.cardIds.map((card: any) => card._id.toString()),
        isArchived: l.isArchived,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get lists error:", error)
    return NextResponse.json(
      { error: "Failed to fetch lists" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
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
    const { title, description, projectId } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Check if board exists and user has access
    const board = await BoardModel.findOne({
      _id: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get the current highest position and increment it
    const lastList = await ListModel.findOne({
      boardId: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    }).sort({ position: -1 })

    const newPosition = lastList ? lastList.position + 1 : 1

    const list = await ListModel.create({
      title,
      description: description || "",
      boardId: boardId,
      projectId: projectId || board.projectId,
      organizationId: decoded.organizationId,
      position: newPosition
    })

    // Add list to board
    await BoardModel.updateOne({ _id: boardId }, { $push: { listIds: list._id } })

    return NextResponse.json(
      {
        id: list._id.toString(),
        title: list.title,
        description: list.description,
        boardId: list.boardId.toString(),
        projectId: list.projectId.toString(),
        position: list.position,
        cardIds: [],
        isArchived: list.isArchived,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create list error:", error)
    return NextResponse.json(
      { error: "Failed to create list" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
