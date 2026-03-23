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
    const { projectId, timeFrame } = body

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

    const getWeekNumber = (d: Date): number => {
      const first = new Date(d.getFullYear(), 0, 1)
      return Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7)
    }

    const parseDateInput = (value?: string): Date | null => {
      if (!value) {
        return null
      }
      // value expected as YYYY-MM-DD from <input type="date">
      const parts = value.split("-").map((p) => Number(p))
      if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
        return null
      }
      const [y, m, d] = parts
      return new Date(y, m - 1, d, 0, 0, 0, 0)
    }

    const startOfWeekMonday = (d: Date): Date => {
      const day = (d.getDay() + 6) % 7 // Monday=0..Sunday=6
      const out = new Date(d)
      out.setDate(d.getDate() - day)
      out.setHours(0, 0, 0, 0)
      return out
    }

    const endOfWeekSunday = (d: Date): Date => {
      const start = startOfWeekMonday(d)
      const out = new Date(start)
      out.setDate(start.getDate() + 6)
      out.setHours(23, 59, 59, 999)
      return out
    }

    const now = new Date()
    const mode = timeFrame?.mode ?? "thisWeek"

    let startDate: Date
    let endDate: Date
    let rangeLabel: string

    if (mode === "last7Days") {
      startDate = new Date(now.getTime() - 6 * 86400000)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
      rangeLabel = "Last 7 days"
    } else if (mode === "custom") {
      const s = parseDateInput(timeFrame?.startDate)
      const e = parseDateInput(timeFrame?.endDate) ?? s
      if (!s || !e) {
        return NextResponse.json(
          { error: "Custom range requires startDate and endDate" },
          { status: 400 }
        )
      }
      startDate = s
      endDate = e
      if (endDate.getTime() < startDate.getTime()) {
        return NextResponse.json({ error: "endDate must be after startDate" }, { status: 400 })
      }
      rangeLabel = `${startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    } else {
      // thisWeek default
      startDate = startOfWeekMonday(now)
      endDate = endOfWeekSunday(now)
      const wn = getWeekNumber(startDate)
      rangeLabel = `Week ${wn}`
    }

    const weekNumber = getWeekNumber(startDate)
    const year = startDate.getFullYear()

    // Filter tasks into the selected time frame.
    // - If a task has dueDate, include it when dueDate falls in range
    // - Always include tasks when createdAt falls in range (so tasks without dueDate still work)
    ;(query as any).$and = [
      {
        $or: [
          { dueDate: { $gte: startDate, $lte: endDate } },
          { createdAt: { $gte: startDate, $lte: endDate } }
        ]
      }
    ]

    const tasks = await TaskModel.find(query)
      .sort({ status: 1, priority: -1, createdAt: -1 })
      .limit(100)
      .populate("project", "name")
      .lean()

    const done = tasks.filter((t) => t.status === "DONE")
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS")
    const todo = tasks.filter((t) => t.status === "TODO")

    const summary = [
      `Task Report — ${rangeLabel}, ${year}`,
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
      year,
      rangeLabel,
      range: { startDate, endDate },
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
