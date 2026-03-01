import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/analytics/velocity
 * Throughput (tasks done per week), lead time, cycle time, per-board velocity
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

    const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000)

    // ── 1. Weekly throughput (DONE tasks per week) ───────────────────────
    const throughputAgg = await TaskModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: "DONE",
          deletedAt: null,
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

    // ── 2. Average lead time (createdAt → DONE, in days) ────────────────
    const leadTimeAgg = await TaskModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: "DONE",
          deletedAt: null,
          updatedAt: { $gte: eightWeeksAgo }
        }
      },
      {
        $addFields: {
          leadTimeDays: {
            $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60 * 60 * 24]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgLeadTime: { $avg: "$leadTimeDays" },
          minLeadTime: { $min: "$leadTimeDays" },
          maxLeadTime: { $max: "$leadTimeDays" },
          totalCompleted: { $sum: 1 }
        }
      }
    ])

    const leadTimeStats = leadTimeAgg[0] ?? {
      avgLeadTime: 0,
      minLeadTime: 0,
      maxLeadTime: 0,
      totalCompleted: 0
    }

    // ── 3. Lead time distribution buckets ───────────────────────────────
    const leadTimeDist = await TaskModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: "DONE",
          deletedAt: null
        }
      },
      {
        $addFields: {
          leadDays: {
            $divide: [{ $subtract: ["$updatedAt", "$createdAt"] }, 1000 * 60 * 60 * 24]
          }
        }
      },
      {
        $bucket: {
          groupBy: "$leadDays",
          boundaries: [0, 1, 3, 7, 14, 30, 999],
          default: "30+",
          output: { count: { $sum: 1 } }
        }
      }
    ])

    const bucketLabels: Record<string | number, string> = {
      0: "< 1d",
      1: "1–3d",
      3: "3–7d",
      7: "7–14d",
      14: "14–30d",
      30: "30+d",
      "30+": "30+d"
    }
    const leadTimeDistFormatted = leadTimeDist.map((b: any) => ({
      range: bucketLabels[b._id] ?? String(b._id),
      count: b.count
    }))

    // ── 4. Per-board throughput (project boards only) ────────────────────
    const boards = await BoardModel.find({
      organizationId: orgId,
      deletedAt: null,
      isArchived: false,
      projectId: { $exists: true, $ne: null }
    })
      .select("_id title")
      .lean()

    const boardVelocity = await Promise.all(
      boards.slice(0, 8).map(async (b: any) => {
        const weeklyAgg = await TaskModel.aggregate([
          {
            $match: {
              board: b._id,
              status: "DONE",
              deletedAt: null,
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
        const total = weeklyAgg.reduce((s: number, d: any) => s + d.count, 0)
        const avgPerWeek = weeklyAgg.length > 0 ? +(total / weeklyAgg.length).toFixed(1) : 0
        return {
          boardId: b._id.toString(),
          title: b.title,
          totalCompleted: total,
          avgPerWeek,
          weekly: weeklyAgg.map((d: any) => ({ week: d._id, count: d.count }))
        }
      })
    )

    // Build unified week labels for throughput chart
    const now = new Date()
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

    const throughputMap = new Map(throughputAgg.map((d: any) => [d._id, d.count]))
    const weeklyThroughput = weekLabels.map((wk, i) => ({
      week: `W-${7 - i}`,
      label: wk,
      completed: throughputMap.get(wk) ?? 0
    }))

    return NextResponse.json({
      weeklyThroughput,
      leadTime: {
        avg: +leadTimeStats.avgLeadTime.toFixed(1),
        min: +leadTimeStats.minLeadTime.toFixed(1),
        max: +leadTimeStats.maxLeadTime.toFixed(1),
        totalCompleted: leadTimeStats.totalCompleted
      },
      leadTimeDist: leadTimeDistFormatted,
      boardVelocity
    })
  } catch (err) {
    console.error("Analytics velocity error:", err)
    return NextResponse.json({ error: "Failed to fetch velocity analytics" }, { status: 500 })
  }
}
