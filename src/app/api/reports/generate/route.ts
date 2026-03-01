import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

/**
 * POST /api/reports/generate
 * Fetch the current user's tasks and return a structured report preview.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId).lean()
    if (!user?.defaultOrganizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { projectId } = body

    // Build query — can be scoped to a project or org-wide for this user
    const query: Record<string, unknown> = {
      organizationId: user.defaultOrganizationId,
      $or: [{ assignee: user._id }, { creator: user._id }],
      deletedAt: null,
      isArchived: false
    }
    if (projectId) {
      query.project = projectId
    }

    const tasks = await TaskModel.find(query)
      .sort({ status: 1, priority: -1, createdAt: -1 })
      .limit(100)
      .populate("project", "name")
      .lean()

    const done = tasks.filter((t) => t.status === "DONE")
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS")
    const todo = tasks.filter((t) => t.status === "TODO")

    const now = new Date()
    const firstDayOfYear = new Date(now.getFullYear(), 0, 1)
    const pastDays = (now.getTime() - firstDayOfYear.getTime()) / 86400000
    const weekNumber = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7)

    const summary = [
      `Task Report — Week ${weekNumber}, ${now.getFullYear()}`,
      `Generated for: ${user.name}`,
      `Generated at: ${now.toISOString()}`,
      ``,
      `=== COMPLETED (${done.length}) ===`,
      ...done.map(
        (t) => `✓ ${t.title}${(t as any).project?.name ? ` [${(t as any).project.name}]` : ""}`
      ),
      ``,
      `=== IN PROGRESS (${inProgress.length}) ===`,
      ...inProgress.map(
        (t) => `→ ${t.title}${(t as any).project?.name ? ` [${(t as any).project.name}]` : ""}`
      ),
      ``,
      `=== TODO (${todo.length}) ===`,
      ...todo.map(
        (t) => `○ ${t.title}${(t as any).project?.name ? ` [${(t as any).project.name}]` : ""}`
      )
    ].join("\n")

    return NextResponse.json({
      weekNumber,
      year: now.getFullYear(),
      user: { name: user.name, email: user.email },
      stats: {
        total: tasks.length,
        done: done.length,
        inProgress: inProgress.length,
        todo: todo.length
      },
      tasks: {
        done: done.map((t) => ({
          _id: t._id,
          title: t.title,
          priority: t.priority,
          project: (t as any).project?.name ?? null,
          dueDate: t.dueDate
        })),
        inProgress: inProgress.map((t) => ({
          _id: t._id,
          title: t.title,
          priority: t.priority,
          project: (t as any).project?.name ?? null,
          dueDate: t.dueDate
        })),
        todo: todo.map((t) => ({
          _id: t._id,
          title: t.title,
          priority: t.priority,
          project: (t as any).project?.name ?? null,
          dueDate: t.dueDate
        }))
      },
      summary
    })
  } catch (err) {
    console.error("Report generate error:", err)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
