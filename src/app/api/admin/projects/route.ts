import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

/**
 * GET /api/admin/projects
 * Returns all projects in the org with task counts and board counts.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const { orgId } = guard

  await connectToDatabase()

  const projects = await ProjectModel.find({ organizationId: orgId, deletedAt: null })
    .sort({ createdAt: -1 })
    .populate("owner", "name email avatar")
    .populate("members", "name email avatar")
    .lean()

  // For each project, count tasks and boards
  const enriched = await Promise.all(
    projects.map(async (p: any) => {
      const [taskTotal, taskDone, boards] = await Promise.all([
        TaskModel.countDocuments({ project: p._id, deletedAt: null }),
        TaskModel.countDocuments({ project: p._id, status: "DONE", deletedAt: null }),
        BoardModel.find({ projectId: p._id, deletedAt: null, isArchived: false })
          .select("_id title")
          .lean()
      ])
      return {
        _id: p._id.toString(),
        title: p.title,
        description: p.description,
        owner: p.owner,
        members: p.members,
        dueDate: p.dueDate,
        isArchived: p.isArchived,
        createdAt: p.createdAt,
        taskTotal,
        taskDone,
        completionRate: taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0,
        boards
      }
    })
  )

  return NextResponse.json({ projects: enriched })
}
