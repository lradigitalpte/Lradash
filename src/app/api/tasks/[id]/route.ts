import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { updateTaskInDb, deleteTaskInDb, getTaskById } from "@/lib/db/task"
import { getUserByEmail } from "@/lib/db/user"
import { dispatchNotification } from "@/lib/notifications/dispatcher"

/**
 * GET /api/tasks/[id]
 * Get task details
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params
    const task = await getTaskById(taskId)

    return NextResponse.json(task)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch task" }, { status: 500 })
  }
}

/**
 * PATCH /api/tasks/[id]
 * Update a task
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    let userEmail = decoded.email
    if (!userEmail) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user) {
        userEmail = user.email
      }
    }

    if (!userEmail) {
      return NextResponse.json({ error: "User email not found" }, { status: 401 })
    }

    const body = await request.json()
    const { id: taskId } = await params

    const updatedTask = await updateTaskInDb(taskId, userEmail, body)

    // Fire-and-forget notification
    const updater = await getUserByEmail(userEmail)
    if (updater) {
      // Determine what changed for a meaningful message
      const changedFields = Object.keys(body).filter((k) => k !== "updatedAt")
      const changeDesc =
        changedFields.length === 1
          ? `${changedFields[0]} was updated`
          : `${changedFields.length} fields were updated`

      const notifType =
        body.status === "DONE" || body.status === "COMPLETED"
          ? ("task_completed" as const)
          : body.assignee
            ? ("task_assigned" as const)
            : ("task_updated" as const)

      dispatchNotification({
        recipientUserId: String(updater._id),
        type: notifType,
        title: `Task Updated: ${(updatedTask as any)?.title ?? taskId}`,
        body: `${changeDesc} by ${updater.name ?? userEmail}.`,
        taskId,
        triggeredBy: {
          userId: String(updater._id),
          name: updater.name ?? userEmail,
          avatar: updater.avatar ?? undefined
        }
      }).catch(() => {})
    }

    return NextResponse.json(updatedTask)
  } catch (error: any) {
    console.error("Update task error:", error)
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 })
  }
}

/**
 * DELETE /api/tasks/[id]
 * Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id: taskId } = await params
    await deleteTaskInDb(taskId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 })
  }
}
