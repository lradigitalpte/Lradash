import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { getAllUserTasks, createPersonalTask } from "@/lib/db/task"
import { getUserByEmail, getUserById } from "@/lib/db/user"

/**
 * GET /api/tasks
 * Workspace task stream: tasks you created, are assigned to, or appear on as assignee,
 * scoped to your org and projects you belong to (plus personal tasks). Most recently updated first.
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

    if (!decoded || (!decoded.userId && !decoded.email)) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null

    if (!user?.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const tasks = await getAllUserTasks(user.email)

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

    if (!decoded || (!decoded.userId && !decoded.email)) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null

    if (!user?.email) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
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
      user.email,
      title,
      description,
      dueDate ? new Date(dueDate) : undefined,
      priority || "MEDIUM",
      status || "TODO"
    )

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
