import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { OrganizationModel } from "@/models/organization.model"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

/**
 * GET /api/admin/stats
 * Returns aggregate statistics for the organization.
 * Requires the caller to be an OWNER or ADMIN of the org.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const { orgId } = guard

  await connectToDatabase()

  // Project-tasks filter: only tasks linked to a project, not personal tasks
  const projectTaskFilter = {
    organizationId: orgId,
    deletedAt: null,
    project: { $exists: true, $ne: null }
  }

  const [
    totalUsers,
    totalProjects,
    totalBoards,
    todoCount,
    inProgressCount,
    doneCount,
    recentProjects,
    subscription
  ] = await Promise.all([
    // Deduplicate owner + members (owner may also appear in members array)
    OrganizationModel.findById(orgId)
      .lean()
      .then((org) => {
        const ids = new Set<string>()
        ids.add((org as any).owner.toString())
        for (const m of (org as any)?.members ?? []) {
          ids.add(m.userId.toString())
        }
        return ids.size
      }),
    ProjectModel.countDocuments({ organizationId: orgId, deletedAt: null, isArchived: false }),
    // Only count boards that belong to a project (not personal boards)
    BoardModel.countDocuments({
      organizationId: orgId,
      deletedAt: null,
      isArchived: false,
      projectId: { $exists: true, $ne: null }
    }),
    TaskModel.countDocuments({ ...projectTaskFilter, status: "TODO" }),
    TaskModel.countDocuments({ ...projectTaskFilter, status: "IN_PROGRESS" }),
    TaskModel.countDocuments({ ...projectTaskFilter, status: "DONE" }),
    // 5 most recently created projects
    ProjectModel.find({ organizationId: orgId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("owner", "name email avatar")
      .lean(),
    OrganizationModel.findById(orgId).select("subscription name slug").lean()
  ])

  const totalTasks = todoCount + inProgressCount + doneCount
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0

  return NextResponse.json({
    users: totalUsers,
    projects: totalProjects,
    boards: totalBoards,
    tasks: {
      total: totalTasks,
      todo: todoCount,
      inProgress: inProgressCount,
      done: doneCount,
      completionRate
    },
    recentProjects,
    organization: subscription
  })
}
