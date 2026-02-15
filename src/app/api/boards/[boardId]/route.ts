import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ListModel } from "@/models/list.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
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

    if (!decoded || !decoded.organizationId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { boardId } = await params

    await connectToDatabase()

    // Fetch board and ensure it exists and belongs to the organization
    const board = await BoardModel.findOne({
      _id: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    }).lean()

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Fetch lists for this board
    const lists = await ListModel.find({
      boardId: boardId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })
      .sort({ position: 1 })
      .populate({
        path: "cardIds",
        model: TaskModel,
        populate: [
          { path: "assignee", model: UserModel, select: "name email avatar" },
          { path: "creator", model: UserModel, select: "name email avatar" }
        ]
      })
      .lean()

    // Format the response to match the frontend expectations
    const formattedBoard = {
      _id: board._id.toString(),
      title: board.title,
      description: board.description,
      projectId:
        (board as any).projectId?.toString() || (board as any).projects?.[0]?._id?.toString(),
      lists: lists.map((list: any) => ({
        _id: list._id.toString(),
        title: list.title,
        position: list.position,
        cards: (list.cardIds || []).map((card: any) => ({
          _id: card._id.toString(),
          title: card.title,
          description: card.description,
          status: card.status,
          dueDate: card.dueDate,
          priority: card.priority,
          listId: list._id.toString(),
          labels: card.labels || [],
          members: card.assignee ? [card.assignee] : [],
          checklist: card.checklist || [],
          attachments: card.attachments || [],
          coverColor: card.coverColor,
          workPackage: card.workPackage?.toString(),
          creator: card.creator,
          createdAt: card.createdAt
        }))
      }))
    }

    return NextResponse.json(formattedBoard, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get board error:", error)
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
