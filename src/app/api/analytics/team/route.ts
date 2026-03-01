import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/analytics/team
 * Per-member workload, task completion rates, comment activity
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

    // ── Get org members ──────────────────────────────────────────────────
    const org = await OrganizationModel.findById(orgId).lean()
    if (!org) {return NextResponse.json({ error: "Org not found" }, { status: 404 })}

    const ownerIdStr = (org as any).owner.toString()
    const memberIds = new Set<string>([ownerIdStr])
    for (const m of (org as any).members ?? []) {memberIds.add(m.userId.toString())}

    const members = await UserModel.find({
      _id: { $in: Array.from(memberIds) },
      deletedAt: null
    })
      .select("_id name email avatar")
      .lean()

    // ── Per-member workload ──────────────────────────────────────────────
    const memberStats = await Promise.all(
      members.map(async (m: any) => {
        const userId = m._id.toString()

        const [total, done, inProgress, todo, created] = await Promise.all([
          TaskModel.countDocuments({ organizationId: orgId, assignee: m._id, deletedAt: null }),
          TaskModel.countDocuments({
            organizationId: orgId,
            assignee: m._id,
            status: "DONE",
            deletedAt: null
          }),
          TaskModel.countDocuments({
            organizationId: orgId,
            assignee: m._id,
            status: "IN_PROGRESS",
            deletedAt: null
          }),
          TaskModel.countDocuments({
            organizationId: orgId,
            assignee: m._id,
            status: "TODO",
            deletedAt: null
          }),
          TaskModel.countDocuments({ organizationId: orgId, creator: m._id, deletedAt: null })
        ])

        // Count comments by this user (activities with type=comment)
        const commentAgg = await TaskModel.aggregate([
          { $match: { organizationId: orgId, deletedAt: null } },
          { $unwind: "$activities" },
          {
            $match: {
              "activities.user": m._id,
              "activities.type": "comment"
            }
          },
          { $count: "total" }
        ])
        const commentCount = commentAgg[0]?.total ?? 0

        return {
          userId,
          name: m.name,
          email: m.email,
          avatar: m.avatar ?? null,
          assigned: total,
          done,
          inProgress,
          todo,
          created,
          commentCount,
          completionRate: total > 0 ? Math.round((done / total) * 100) : 0
        }
      })
    )

    // ── Weekly contributions (tasks completed per member, last 6 weeks) ─
    const sixWeeksAgo = new Date(Date.now() - 6 * 7 * 24 * 60 * 60 * 1000)
    const weeklyContribAgg = await TaskModel.aggregate([
      {
        $match: {
          organizationId: orgId,
          status: "DONE",
          deletedAt: null,
          updatedAt: { $gte: sixWeeksAgo },
          assignee: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            week: { $dateToString: { format: "%Y-%U", date: "$updatedAt" } },
            user: "$assignee"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.week": 1 } }
    ])

    // Sort members by "assigned" desc for leaderboard
    memberStats.sort((a, b) => b.assigned - a.assigned)

    return NextResponse.json({
      members: memberStats,
      weeklyContrib: weeklyContribAgg.map((d: any) => ({
        week: d._id.week,
        userId: d._id.user.toString(),
        count: d.count
      }))
    })
  } catch (err) {
    console.error("Analytics team error:", err)
    return NextResponse.json({ error: "Failed to fetch team analytics" }, { status: 500 })
  }
}
