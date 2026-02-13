import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { updateTaskInDb, deleteTaskInDb, getTaskById } from "@/lib/db/task"

/**
 * GET /api/tasks/[id]
 * Get task details
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const taskId = params.id
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
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const taskId = params.id

    const updatedTask = await updateTaskInDb(taskId, decoded.email, body)

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
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const taskId = params.id
    await deleteTaskInDb(taskId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete task error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 })
  }
}
