import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { canAccessBoard, canManageBoard } from "@/lib/board-access"
import { deleteBoardInDb } from "@/lib/db/board"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ListModel } from "@/models/list.model"
import { ProjectModel } from "@/models/project.model"
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

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { boardId } = await params

    await connectToDatabase()

    const board = await BoardModel.findOne({
      _id: boardId,
      deletedAt: null
    }).lean()

    if (!board) {
      return NextResponse.json(
        { error: "Board not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const userId = decoded.userId?.toString()
    const hasAccess = await canAccessBoard(board, userId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403, headers: { "Content-Type": "application/json" } }
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
      canManage: await canManageBoard(board, userId),
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

/** PATCH: update board (e.g. projectId to link board to a project) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { boardId } = await params
    const body = await request.json()
    const { projectId: newProjectId } = body

    await connectToDatabase()

    const board = await BoardModel.findOne({
      _id: boardId,
      deletedAt: null
    }).lean()

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const canManage = await canManageBoard(board, decoded.userId.toString())
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let orgId = decoded.organizationId?.toString()
    if (!orgId) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      orgId = (user as any)?.defaultOrganizationId?.toString()
    }
    const boardOrgId = (board as any).organizationId?.toString()
    if (!boardOrgId || !orgId || boardOrgId !== orgId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}

    if (body.hasOwnProperty("projectId")) {
      if (newProjectId === null || newProjectId === "") {
        updates.projectId = null
      } else {
        const project = await ProjectModel.findOne({
          _id: newProjectId,
          organizationId: orgId,
          deletedAt: null,
          $or: [{ owner: decoded.userId }, { members: decoded.userId }]
        } as any).lean()
        if (!project) {
          return NextResponse.json(
            { error: "Project not found or you do not have access" },
            { status: 404 }
          )
        }
        updates.projectId = new mongoose.Types.ObjectId(newProjectId)
      }
    }

    if (body.hasOwnProperty("title")) {
      updates.title = body.title
    }
    if (body.hasOwnProperty("description")) {
      updates.description = body.description
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const updated = await BoardModel.findByIdAndUpdate(
      boardId,
      { $set: updates },
      { new: true }
    ).lean()

    return NextResponse.json({
      _id: updated?._id?.toString(),
      title: updated?.title,
      description: updated?.description,
      projectId: (updated as any)?.projectId?.toString() ?? null
    })
  } catch (error) {
    console.error("Patch board error:", error)
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { boardId } = await params
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const canManage = await canManageBoard(board, decoded.userId.toString())
    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await UserModel.findById(decoded.userId).select("email").lean()
    if (!user?.email) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const deleted = await deleteBoardInDb(boardId, user.email)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete board" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete board error:", error)
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 })
  }
}
