import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
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

    const { boardId } = await params
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const userId = decoded.userId.toString()
    const ownerId = (board as any).owner?.toString()
    const memberIds = ((board as any).members || []).map((m: any) => m?.toString?.() ?? m)
    if (ownerId !== userId && !memberIds.includes(userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const tasks = await TaskModel.find({
      board: boardId,
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

    const { boardId } = await params
    const body = await request.json()
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const userId = decoded.userId.toString()
    const ownerId = (board as any).owner?.toString()
    const memberIds = ((board as any).members || []).map((m: any) => m?.toString?.() ?? m)
    if (ownerId !== userId && !memberIds.includes(userId)) {
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

    const task = await TaskModel.create({
      title: body.title ?? "New task",
      description: body.description ?? "",
      status: body.status ?? "TODO",
      priority: body.priority ?? "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      board: boardId,
      project: undefined,
      organizationId: orgId,
      creator: decoded.userId,
      lastModifier: decoded.userId,
      assignee: body.assigneeId || undefined,
      ...(workPackageId && { workPackage: workPackageId })
    } as any)

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
