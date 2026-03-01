import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { getAllUserTasks, createPersonalTask } from "@/lib/db/task"
import { getUserByEmail } from "@/lib/db/user"
import { dispatchNotification } from "@/lib/notifications/dispatcher"

/**
 * GET /api/tasks
 * Fetch all tasks for the authenticated user (personal + project tasks)
 */
export async function GET(request: NextRequest) {
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

    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const tasks = await getAllUserTasks(decoded.email)

    return NextResponse.json(tasks, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

/**
 * POST /api/tasks
 * Create a new personal task (not tied to a project)
 */
export async function POST(request: NextRequest) {
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

    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { title, description, dueDate, priority, status } = body

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const task = await createPersonalTask(
      decoded.email,
      title,
      description,
      dueDate ? new Date(dueDate) : undefined,
      priority || "MEDIUM",
      status || "TODO"
    )

    // Fire-and-forget notification to the task creator
    const creator = await getUserByEmail(decoded.email)
    if (creator) {
      dispatchNotification({
        recipientUserId: String(creator._id),
        type: "task_created",
        title: `Task Created: ${title}`,
        body: description
          ? `${description.slice(0, 100)}${description.length > 100 ? "…" : ""}`
          : `New task "${title}" has been created.`,
        taskId: String(task._id),
        triggeredBy: {
          userId: String(creator._id),
          name: creator.name ?? decoded.email,
          avatar: creator.avatar ?? undefined
        }
      }).catch(() => {}) // don't block the response
    }

    return NextResponse.json(task, {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Create personal task error:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
