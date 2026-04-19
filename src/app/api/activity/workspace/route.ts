import { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

/**
 * GET /api/activity/workspace
 * Returns recent activities from tasks in:
 * - Projects where user is a member
 * - Boards where user is a member
 * - Tasks assigned to user
 * - Tasks where user is mentioned
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    await connectToDatabase()

    const userId = new Types.ObjectId(access.user._id)
    const orgId = new Types.ObjectId(access.org._id)

    // Find projects where user is a member
    const memberProjects = await ProjectModel.find({
      organizationId: orgId,
      $or: [{ owner: userId }, { members: userId }],
      deletedAt: null
    } as any).select("_id")

    const projectIds = memberProjects.map((p) => p._id)

    // Find boards where user is a member
    const memberBoards = await BoardModel.find({
      organizationId: orgId,
      $or: [{ owner: userId }, { members: userId }],
      deletedAt: null
    } as any).select("_id")

    const boardIds = memberBoards.map((b) => b._id)

    // Get all relevant tasks
    const tasks = await TaskModel.find({
      organizationId: orgId,
      deletedAt: null,
      $or: [
        { project: { $in: projectIds } }, // Tasks in user's projects
        { board: { $in: boardIds } }, // Tasks in user's boards
        { assignee: userId }, // Tasks assigned to user
        { assignees: userId }, // Tasks in user's assignees list
        { "activities.mentions.userId": userId } // Tasks where user is mentioned
      ],
      "activities.0": { $exists: true }
    } as any)
      .select("_id title project board activities")
      .populate("project", "title")
      .populate("board", "title")
      .populate("activities.user", "name email avatar")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean()

    // Flatten activities and add task context
    const allActivities: any[] = []
    for (const task of tasks) {
      const taskAny = task as any
      for (const activity of taskAny.activities ?? []) {
        allActivities.push({
          _id: activity._id?.toString(),
          type: activity.type,
          text: activity.text,
          createdAt: activity.createdAt,
          user: activity.user,
          task: {
            _id: taskAny._id.toString(),
            title: taskAny.title,
            project: taskAny.project,
            board: taskAny.board
          }
        })
      }
    }

    // Sort by date descending
    allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ activities: allActivities.slice(0, 50) })
  } catch (error) {
    console.error("Workspace activity fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch workspace activities" }, { status: 500 })
  }
}
