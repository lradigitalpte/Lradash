import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { canAccessBoard } from "@/lib/board-access"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ListModel } from "@/models/list.model"
import { TaskModel } from "@/models/task.model"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    // Fallback for missing organizationId in token
    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const board = await BoardModel.findOne({
      _id: boardId,
      organizationId,
      deletedAt: null
    }).lean()

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const hasAccess = await canAccessBoard(board, decoded.userId?.toString())
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { taskId, sourceListId, targetListId, newPosition } = body

    if (!taskId || !sourceListId || !targetListId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle same list reordering
    if (sourceListId === targetListId) {
      const list = await ListModel.findOne({ _id: sourceListId, organizationId })
      if (!list) {
        return NextResponse.json({ error: "List not found" }, { status: 404 })
      }

      const newCardIds = [...list.cardIds].map((id) => id.toString())
      const currentIndex = newCardIds.indexOf(taskId)

      if (currentIndex !== -1) {
        newCardIds.splice(currentIndex, 1) // Remove
        newCardIds.splice(newPosition, 0, taskId) // Insert at new pos

        await ListModel.updateOne({ _id: sourceListId }, { $set: { cardIds: newCardIds } })
      }
    } else {
      // Move between lists
      // 1. Remove from source list
      await ListModel.updateOne(
        { _id: sourceListId, organizationId },
        { $pull: { cardIds: taskId } }
      )

      // 2. Add to target list at position
      const targetList = await ListModel.findOne({ _id: targetListId, organizationId })
      if (!targetList) {
        return NextResponse.json({ error: "Target list not found" }, { status: 404 })
      }

      const newCardIds = [...targetList.cardIds].map((id) => id.toString())
      // Ensure no duplicates just in case
      const existingIndex = newCardIds.indexOf(taskId)
      if (existingIndex !== -1) {
        newCardIds.splice(existingIndex, 1)
      }

      newCardIds.splice(newPosition, 0, taskId)

      await ListModel.updateOne({ _id: targetListId }, { $set: { cardIds: newCardIds } })

      // 3. Update task status based on list title
      const listLabels = targetList.title.toUpperCase().replace(/\s+/g, "_")
      const validStatuses = ["TODO", "IN_PROGRESS", "DONE"]

      let newStatus = null
      if (validStatuses.includes(listLabels)) {
        newStatus = listLabels
      } else if (targetList.title.toLowerCase() === "to do") {
        newStatus = "TODO"
      } else if (targetList.title.toLowerCase() === "in progress") {
        newStatus = "IN_PROGRESS"
      } else if (targetList.title.toLowerCase() === "done") {
        newStatus = "DONE"
      }

      if (newStatus) {
        await TaskModel.updateOne({ _id: taskId }, { $set: { status: newStatus } })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Move task error:", error)
    return NextResponse.json({ error: "Failed to move task" }, { status: 500 })
  }
}
