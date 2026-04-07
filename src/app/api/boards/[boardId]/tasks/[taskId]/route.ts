import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { canAccessBoard } from "@/lib/board-access"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { TaskModel } from "@/models/task.model"

/** GET: single board task */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { boardId, taskId } = await params
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board || !(await canAccessBoard(board, decoded.userId.toString()))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await TaskModel.findOne({
      _id: taskId,
      board: boardId,
      deletedAt: null
    })
      .populate([
        { path: "assignee", select: "name avatar email" },
        { path: "creator", select: "name avatar email" }
      ])
      .lean()

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("Board task GET error:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

/** PATCH: update board task (title, description, status, priority, dueDate, attachments) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { boardId, taskId } = await params
    const body = await request.json()
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board || !(await canAccessBoard(board, decoded.userId.toString()))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const task = await TaskModel.findOne({
      _id: taskId,
      board: boardId,
      deletedAt: null
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const set: Record<string, unknown> = {
      lastModifier: decoded.userId
    }
    if (body.title !== undefined) {
      set.title = body.title
    }
    if (body.description !== undefined) {
      set.description = body.description
    }
    if (body.status !== undefined) {
      set.status = body.status
    }
    if (body.priority !== undefined) {
      set.priority = body.priority
    }
    if (body.dueDate !== undefined) {
      set.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if (body.attachments !== undefined) {
      set.attachments = body.attachments
    }

    const updated = await TaskModel.findOneAndUpdate(
      { _id: taskId, board: boardId, deletedAt: null },
      { $set: set },
      { new: true }
    )
      .populate([
        { path: "assignee", select: "name avatar email" },
        { path: "creator", select: "name avatar email" }
      ])
      .lean()

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Board task PATCH error:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

/** DELETE: remove board task */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { boardId, taskId } = await params
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board || !(await canAccessBoard(board, decoded.userId.toString()))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const result = await TaskModel.findOneAndUpdate(
      { _id: taskId, board: boardId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )

    if (!result) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Board task DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
