import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { updateTaskInDb, deleteTaskInDb, getTaskById } from "@/lib/db/task"
import { getUserByEmail, getUserById } from "@/lib/db/user"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { dispatchNotification } from "@/lib/notifications/dispatcher"
import { UserModel } from "@/models/user.model"

function getEntityId(value: unknown): string | null {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object") {
    const entity = value as { _id?: unknown; id?: unknown; toString?: () => string }
    if (entity._id) {
      return String(entity._id)
    }
    if (entity.id) {
      return String(entity.id)
    }
    if (entity.toString && entity.toString() !== "[object Object]") {
      return entity.toString()
    }
  }

  return String(value)
}

function describeTaskChanges(body: Record<string, unknown>): string {
  const changeLabels: string[] = []

  if (typeof body.title === "string") {
    changeLabels.push("title")
  }
  if (typeof body.description === "string") {
    changeLabels.push("description")
  }
  if (typeof body.status === "string") {
    changeLabels.push("status")
  }
  if (typeof body.priority === "string") {
    changeLabels.push("priority")
  }
  if (body.dueDate !== undefined) {
    changeLabels.push("due date")
  }
  if (body.assigneeId !== undefined || body.assignee !== undefined) {
    changeLabels.push("assignee")
  }
  if (body.checklist !== undefined) {
    changeLabels.push("checklist")
  }
  if (body.labels !== undefined) {
    changeLabels.push("labels")
  }
  if (body.attachments !== undefined) {
    changeLabels.push("attachments")
  }

  if (changeLabels.length === 0) {
    return "Task details were updated"
  }

  if (changeLabels.length === 1) {
    return `Updated ${changeLabels[0]}`
  }

  return `Updated ${changeLabels.slice(0, -1).join(", ")} and ${changeLabels.at(-1)}`
}

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

    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null

    const userEmail = user?.email
    if (!userEmail) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = (await request.json()) as Record<string, unknown>
    const { id: taskId } = await params

    const updatedTask = await updateTaskInDb(taskId, userEmail, body)

    // Fire-and-forget notifications
    if (user) {
      const taskTitle = (updatedTask as any)?.title ?? taskId
      const taskProjectId = getEntityId((updatedTask as any)?.project)
      const isCompleting = body.status === "DONE" || body.status === "COMPLETED"
      const nextAssigneeId = getEntityId(body.assigneeId ?? body.assignee)
      const isAssigning = !!nextAssigneeId
      const changeSummary = describeTaskChanges(body)
      const shouldNotifyCreator = isCompleting || isAssigning
      const creatorId = getEntityId((updatedTask as any)?.creator)

      // Email + in-app notify the ASSIGNEE when a task is assigned to them
      if (isAssigning && nextAssigneeId !== String(user._id)) {
        try {
          await connectToDatabase()
          const assignee = (await UserModel.findById(nextAssigneeId)
            .select("name email notificationEmail avatar preferences.emailNotifications")
            .lean()) as any
          const recipientEmail = getNotificationEmail(assignee)
          if (recipientEmail) {
            dispatchNotification({
              recipientUserId: String(assignee._id),
              type: "task_assigned",
              title: `Task Assigned: ${taskTitle}`,
              body: `${user.name ?? userEmail} assigned you to "${taskTitle}".`,
              taskId,
              projectId: taskProjectId ?? undefined,
              triggeredBy: {
                userId: String(user._id),
                name: user.name ?? userEmail,
                avatar: user.avatar ?? undefined
              },
              email: {
                recipientEmail,
                recipientName: assignee.name ?? assignee.email,
                taskTitle,
                taskDescription: (updatedTask as any)?.description,
                taskStatus: (updatedTask as any)?.status,
                taskPriority: (updatedTask as any)?.priority,
                taskDueDate: (updatedTask as any)?.dueDate
                  ? new Date((updatedTask as any).dueDate).toLocaleDateString()
                  : undefined,
                changes: changeSummary
              }
            }).catch(() => {})
          }
        } catch (err) {
          console.error("[Notify assignee] Error:", err)
        }
      }

      // Email + in-app notify the CREATOR when someone else updates or completes their task
      if (shouldNotifyCreator && creatorId && creatorId !== String(user._id)) {
        try {
          await connectToDatabase()
          const creator = (await UserModel.findById(creatorId)
            .select("name email notificationEmail avatar preferences.emailNotifications")
            .lean()) as any
          const recipientEmail = getNotificationEmail(creator)
          if (recipientEmail) {
            const creatorBody = isCompleting
              ? `${user.name ?? userEmail} completed a task you assigned.`
              : `${user.name ?? userEmail} assigned this task to ${nextAssigneeId === creatorId ? "you" : "another teammate"}.`
            const creatorChanges = isCompleting
              ? `Task completed by ${user.name ?? userEmail}`
              : `Task reassigned by ${user.name ?? userEmail}`
            const creatorType = isCompleting
              ? ("task_completed" as const)
              : ("task_assigned" as const)

            dispatchNotification({
              recipientUserId: creatorId,
              type: creatorType,
              title: isCompleting ? `Task Completed: ${taskTitle}` : `Task Assigned: ${taskTitle}`,
              body: creatorBody,
              taskId,
              projectId: taskProjectId ?? undefined,
              triggeredBy: {
                userId: String(user._id),
                name: user.name ?? userEmail,
                avatar: user.avatar ?? undefined
              },
              email: {
                recipientEmail,
                recipientName: creator.name ?? creator.email,
                taskTitle,
                taskDescription: (updatedTask as any)?.description,
                taskStatus: (updatedTask as any)?.status,
                taskPriority: (updatedTask as any)?.priority,
                taskDueDate: (updatedTask as any)?.dueDate
                  ? new Date((updatedTask as any).dueDate).toLocaleDateString()
                  : undefined,
                changes: creatorChanges
              }
            }).catch(() => {})
          }
        } catch (err) {
          console.error("[Notify creator] Error:", err)
        }
      }
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
