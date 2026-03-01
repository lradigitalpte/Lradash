import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/analytics/projects
 * Returns project & task analytics for the org:
 * - Weekly task creation vs completion (8 weeks)
 * - Priority breakdown
 * - Overdue tasks count
 * - Per-project completion rates
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.email) {return NextResponse.json({ error: "Invalid token" }, { status: 401 })}

    await connectToDatabase()
    const user = await UserModel.findOne({ email: decoded.email.toLowerCase() }).lean()
    if (!user) {return NextResponse.json({ error: "User not found" }, { status: 404 })}

    const orgId = (user as any).defaultOrganizationId
    if (!orgId) {return NextResponse.json({ error: "No organization" }, { status: 400 })}

    const now = new Date()
    // 8 weeks back (project tasks only)
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000)
    const baseFilter = {
      organizationId: orgId,
      deletedAt: null,
      project: { $exists: true, $ne: null }
    }

    // ── 1. Weekly created vs completed ──────────────────────────────────────
    const [createdAgg, completedAgg] = await Promise.all([
      TaskModel.aggregate([
        { $match: { ...baseFilter, createdAt: { $gte: eightWeeksAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%U", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      TaskModel.aggregate([
        {
          $match: {
            ...baseFilter,
            status: "DONE",
            updatedAt: { $gte: eightWeeksAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%U", date: "$updatedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ])

    // Build a unified 8-week labels array
    const weekLabels: string[] = []
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
      const yr = d.getUTCFullYear()
      const jan1 = new Date(Date.UTC(yr, 0, 1))
      const weekNum = Math.ceil(
        ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getUTCDay() + 1) / 7
      )
      weekLabels.push(`${yr}-${String(weekNum).padStart(2, "0")}`)
    }

    const createdMap = new Map(createdAgg.map((d: any) => [d._id, d.count]))
    const completedMap = new Map(completedAgg.map((d: any) => [d._id, d.count]))

    const weeklyTrend = weekLabels.map((wk, i) => ({
      week: `W-${7 - i}`,
      label: wk,
      created: createdMap.get(wk) ?? 0,
      completed: completedMap.get(wk) ?? 0
    }))

    // ── 2. Priority breakdown ─────────────────────────────────────────────
    const priorityAgg = await TaskModel.aggregate([
      { $match: { ...baseFilter } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ])
    const priorityBreakdown = priorityAgg.map((d: any) => ({
      priority: d._id ?? "MEDIUM",
      count: d.count
    }))

    // ── 3. Overdue tasks ───────────────────────────────────────────────────
    const overdueCount = await TaskModel.countDocuments({
      ...baseFilter,
      dueDate: { $lt: now },
      status: { $ne: "DONE" }
    })

    // ── 4. Per-project completion rates ──────────────────────────────────
    const projects = await ProjectModel.find({
      organizationId: orgId,
      deletedAt: null,
      isArchived: false
    })
      .select("_id title")
      .lean()

    const projectStats = await Promise.all(
      projects.map(async (p: any) => {
        const [total, done, overdue] = await Promise.all([
          TaskModel.countDocuments({ project: p._id, deletedAt: null }),
          TaskModel.countDocuments({ project: p._id, status: "DONE", deletedAt: null }),
          TaskModel.countDocuments({
            project: p._id,
            deletedAt: null,
            dueDate: { $lt: now },
            status: { $ne: "DONE" }
          })
        ])
        return {
          _id: p._id,
          title: p.title,
          total,
          done,
          inProgress: 0,
          todo: total - done,
          overdue,
          completionRate: total > 0 ? Math.round((done / total) * 100) : 0
        }
      })
    )

    return NextResponse.json({
      weeklyTrend,
      priorityBreakdown,
      overdueCount,
      projectStats
    })
  } catch (err) {
    console.error("Analytics projects error:", err)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
