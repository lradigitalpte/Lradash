import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ListModel } from "@/models/list.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; listId: string }> }
) {
  try {
    const { boardId, listId } = await params
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

    const list = await ListModel.findOne({
      _id: listId,
      boardId: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })
      .populate("cardIds")
      .lean()

    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: list._id.toString(),
        title: list.title,
        description: list.description,
        boardId: list.boardId.toString(),
        projectId: list.projectId.toString(),
        position: list.position,
        cardIds: list.cardIds.map((card: any) => card._id.toString()),
        isArchived: list.isArchived,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch list" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; listId: string }> }
) {
  try {
    const { boardId, listId } = await params
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
    const { title, description, position, cardIds } = body

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

    const updateData: any = {}
    if (title !== undefined) {
      updateData.title = title
    }
    if (description !== undefined) {
      updateData.description = description
    }
    if (position !== undefined) {
      updateData.position = position
    }
    if (cardIds !== undefined) {
      updateData.cardIds = cardIds
    }

    const list = await ListModel.findOneAndUpdate(
      {
        _id: listId,
        boardId: boardId,
        organizationId: decoded.organizationId,
        deletedAt: null
      },
      updateData,
      { new: true }
    )
      .populate("cardIds")
      .lean()

    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: list._id.toString(),
        title: list.title,
        description: list.description,
        boardId: list.boardId.toString(),
        projectId: list.projectId.toString(),
        position: list.position,
        cardIds: list.cardIds.map((card: any) => card._id.toString()),
        isArchived: list.isArchived,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Update list error:", error)
    return NextResponse.json(
      { error: "Failed to update list" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; listId: string }> }
) {
  try {
    const { boardId, listId } = await params
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

    const list = await ListModel.findOne({
      _id: listId,
      boardId: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })

    if (!list) {
      return NextResponse.json(
        { error: "List not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Soft delete the list
    await ListModel.updateOne({ _id: listId }, { deletedAt: new Date() })

    // Remove list from board
    await BoardModel.updateOne({ _id: boardId }, { $pull: { listIds: listId } })

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Delete list error:", error)
    return NextResponse.json(
      { error: "Failed to delete list" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
