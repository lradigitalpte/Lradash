import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { canAccessBoard } from "@/lib/board-access"
import { connectToDatabase } from "@/lib/db/connect"
import { parseRecordedCreatedAt } from "@/lib/tasks/recorded-created-at"
import { BoardModel } from "@/models/board.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"
import { WorkPackageModel } from "@/models/workpackage.model"

/** GET: list tasks for this board only (board-scoped, not project). Not visible to org admins. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
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

    const { boardId: rawBoardId } = await params
    const boardId = Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId
    await connectToDatabase()

    if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
      return NextResponse.json({ error: "Invalid board id" }, { status: 400 })
    }

    const boardObjectId = new mongoose.Types.ObjectId(boardId)

    const board = await BoardModel.findOne({ _id: boardObjectId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const hasAccess = await canAccessBoard(board, decoded.userId.toString())
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tasks = await TaskModel.find({
      board: boardObjectId,
      deletedAt: null
    })
      .populate([
        { path: "assignee", select: "name avatar email" },
        { path: "creator", select: "name avatar email" },
        { path: "lastModifier", select: "name avatar email" }
      ])
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("Board tasks GET error:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

/** POST: create a task on this board only (no project). User-level; not visible in admin/analytics. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
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

    const { boardId: rawBoardId } = await params
    const boardId = Array.isArray(rawBoardId) ? rawBoardId[0] : rawBoardId
    const body = await request.json()
    await connectToDatabase()

    if (!boardId || !mongoose.Types.ObjectId.isValid(boardId)) {
      return NextResponse.json({ error: "Invalid board id" }, { status: 400 })
    }

    const boardObjectId = new mongoose.Types.ObjectId(boardId)

    const board = await BoardModel.findOne({ _id: boardObjectId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const hasAccess = await canAccessBoard(board, decoded.userId.toString())
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const user = await UserModel.findById(decoded.userId).lean()
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const orgId = (board as any).organizationId
    if (!orgId) {
      return NextResponse.json({ error: "Board has no organization" }, { status: 400 })
    }

    let workPackageId: string | undefined
    if (body.workPackageId) {
      const wp = await WorkPackageModel.findById(body.workPackageId).lean()
      if (!wp) {
        return NextResponse.json({ error: "Work package not found" }, { status: 400 })
      }
      const wpBoardId = (wp as any).boardId?.toString?.()
      // If WP is tied to a board, it must be this board. Otherwise it can be a project WP (link workflow).
      if (wpBoardId && wpBoardId !== boardId) {
        return NextResponse.json(
          { error: "Work package must belong to this workspace" },
          { status: 400 }
        )
      }
      workPackageId = (wp as any)._id?.toString?.()
    }

    const recorded = parseRecordedCreatedAt(body.recordedCreatedAt)
    if (recorded.error) {
      return NextResponse.json({ error: recorded.error }, { status: 400 })
    }

    const now = new Date()
    const createPayload: Record<string, unknown> = {
      title: body.title ?? "New task",
      description: body.description ?? "",
      status: body.status ?? "TODO",
      priority: body.priority ?? "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      board: boardObjectId,
      project: undefined,
      organizationId: orgId,
      creator: decoded.userId,
      lastModifier: decoded.userId,
      assignee: body.assigneeId || undefined,
      ...(workPackageId && { workPackage: workPackageId })
    }
    if (recorded.date) {
      createPayload.createdAt = recorded.date
      createPayload.updatedAt = now
    }

    const task = await TaskModel.create(createPayload as any)

    await task.populate([
      { path: "assignee", select: "name avatar email" },
      { path: "creator", select: "name avatar email" },
      { path: "lastModifier", select: "name avatar email" }
    ])

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error("Board tasks POST error:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
