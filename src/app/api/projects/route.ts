import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

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

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const projects = await ProjectModel.find({
      organizationId: organizationId,
      deletedAt: null
    })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .lean()

    // Aggregate per-project task stats in one query
    const projectIds = projects.map((p: any) => p._id)
    const orgObjectId = new mongoose.Types.ObjectId(organizationId)
    const now = new Date()
    const taskStats = await TaskModel.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          organizationId: orgObjectId,
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
        }
      },
      {
        $group: {
          _id: "$project",
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
          todo: { $sum: { $cond: [{ $eq: ["$status", "TODO"] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$dueDate", null] },
                    { $lt: ["$dueDate", now] },
                    { $ne: ["$status", "DONE"] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    const statsMap = new Map(taskStats.map((s: any) => [s._id.toString(), s]))

    // Per-assignee task counts (for Team Workload view)
    const assigneeStats = await TaskModel.aggregate([
      {
        $match: {
          project: { $in: projectIds },
          organizationId: orgObjectId,
          assignee: { $ne: null },
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
        }
      },
      {
        $group: {
          _id: { project: "$project", assignee: "$assignee" },
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } }
        }
      }
    ])

    // Group assignee stats by projectId
    const assigneeMap = new Map<string, Array<{ memberId: string; total: number; done: number }>>()
    for (const s of assigneeStats) {
      const pid = s._id.project.toString()
      if (!assigneeMap.has(pid)) {
        assigneeMap.set(pid, [])
      }
      assigneeMap
        .get(pid)!
        .push({ memberId: s._id.assignee.toString(), total: s.total, done: s.done })
    }

    return NextResponse.json(
      projects.map((p: any) => {
        const stats = statsMap.get(p._id.toString()) || {
          total: 0,
          done: 0,
          inProgress: 0,
          todo: 0,
          overdue: 0
        }
        const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

        let status = "on_track"
        if (completionRate === 100) {
          status = "completed"
        } else if (stats.overdue > 0 && stats.overdue >= Math.ceil(stats.total * 0.3)) {
          status = "off_track"
        } else if (stats.overdue > 0) {
          status = "at_risk"
        }

        const memberStats = assigneeMap.get(p._id.toString()) || []

        return {
          id: p._id.toString(),
          title: p.title,
          description: p.description,
          owner: p.owner,
          members: (p.members || []).map((m: any) => ({
            _id: m._id?.toString(),
            name: m.name || "Member",
            email: m.email,
            avatar: m.avatar || null
          })),
          dueDate: p.dueDate,
          organizationId: p.organizationId.toString(),
          isArchived: p.isArchived,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          taskStats: {
            total: stats.total,
            done: stats.done,
            inProgress: stats.inProgress,
            todo: stats.todo,
            overdue: stats.overdue,
            completionRate
          },
          memberStats,
          status
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

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

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, dueDate, memberIds } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Build project data
    const projectData: any = {
      title,
      description: description || "",
      organizationId: organizationId,
      owner: decoded.userId,
      members: [decoded.userId] // Owner is always a member
    }

    // Add dueDate if provided
    if (dueDate) {
      projectData.dueDate = new Date(dueDate)
    }

    // Add additional members if provided
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      // Use unique IDs to avoid duplicates (ensure strings are compared correctly)
      const allMemberIds = [decoded.userId, ...memberIds].map((id) => id.toString())
      const uniqueMemberIds = Array.from(new Set(allMemberIds))
      projectData.members = uniqueMemberIds
    }

    const project: any = await ProjectModel.create(projectData)

    return NextResponse.json(
      {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        dueDate: project.dueDate,
        members: project.members,
        organizationId: project.organizationId.toString(),
        owner: decoded.userId
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
