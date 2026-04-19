import { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

interface SearchResult {
  id: string
  type: "task" | "project" | "board"
  title: string
  description?: string
  icon?: string
  url?: string
  metadata?: {
    status?: string
    priority?: string
    dueDate?: string
    assignee?: string
    projectName?: string
    boardName?: string
  }
}

/**
 * GET /api/search
 * Search across tasks, projects, and boards
 * Query params:
 * - q: search query
 * - type: filter by type (task|project|board) - optional
 * - limit: max results per type (default 5)
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")?.trim()
    const type = searchParams.get("type")
    const limit = parseInt(searchParams.get("limit") || "5", 10)

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] })
    }

    await connectToDatabase()

    const userId = new Types.ObjectId(access.user._id)
    const orgId = new Types.ObjectId(access.org._id)

    // Build regex for case-insensitive search
    const searchRegex = new RegExp(query, "i")

    const results: SearchResult[] = []

    // Search tasks
    if (!type || type === "task") {
      const tasks = await TaskModel.find({
        organizationId: orgId,
        deletedAt: null,
        $or: [{ title: searchRegex }, { description: searchRegex }]
      } as any)
        .select("_id title description status priority dueDate assignee project")
        .populate("assignee", "name")
        .populate("project", "title _id")
        .limit(limit)
        .lean()

      for (const task of tasks) {
        const taskAny = task as any
        results.push({
          id: taskAny._id.toString(),
          type: "task",
          title: taskAny.title,
          description: taskAny.description,
          icon: "CheckCircle",
          url: `/projects/${taskAny.project?._id || "personal"}/tasks/${taskAny._id}`,
          metadata: {
            status: taskAny.status,
            priority: taskAny.priority,
            dueDate: taskAny.dueDate ? new Date(taskAny.dueDate).toLocaleDateString() : undefined,
            assignee: taskAny.assignee?.name,
            projectName: taskAny.project?.title
          }
        })
      }
    }

    // Search projects
    if (!type || type === "project") {
      const projects = await ProjectModel.find({
        organizationId: orgId,
        deletedAt: null,
        $or: [{ title: searchRegex }, { description: searchRegex }]
      } as any)
        .select("_id title description status")
        .limit(limit)
        .lean()

      for (const project of projects) {
        const projectAny = project as any
        results.push({
          id: projectAny._id.toString(),
          type: "project",
          title: projectAny.title,
          description: projectAny.description,
          icon: "FolderKanban",
          url: `/projects/${projectAny._id}`,
          metadata: {
            status: projectAny.status
          }
        })
      }
    }

    // Search boards
    if (!type || type === "board") {
      const boards = await BoardModel.find({
        organizationId: orgId,
        deletedAt: null,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { members: userId } // User is member
        ]
      } as any)
        .select("_id title description")
        .limit(limit)
        .lean()

      for (const board of boards) {
        const boardAny = board as any
        results.push({
          id: boardAny._id.toString(),
          type: "board",
          title: boardAny.title,
          description: boardAny.description,
          icon: "LayoutKanban",
          url: `/boards/${boardAny._id}`
        })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Failed to search" }, { status: 500 })
  }
}
