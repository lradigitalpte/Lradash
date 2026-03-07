import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

/**
 * GET /api/projects/[projectId]/tasks/activity
 * Returns task activity log (comments & updates) for this project's tasks.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()
    const { projectId } = await params

    const project = await ProjectModel.findById(projectId).lean()
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const tasks = await TaskModel.find({
      project: projectId,
      deletedAt: null,
      "activities.0": { $exists: true }
    })
      .select("_id title status activities")
      .populate("activities.user", "name email avatar")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean()

    const activities: any[] = []
    for (const task of tasks) {
      const t = task as any
      for (const act of t.activities ?? []) {
        activities.push({
          _id: act._id?.toString(),
          type: act.type,
          text: act.text,
          createdAt: act.createdAt,
          user: act.user,
          task: { _id: t._id.toString(), title: t.title, status: t.status }
        })
      }
    }
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      activities: activities.slice(0, 100),
      projectTitle: (project as any).title
    })
  } catch (error) {
    console.error("Activity fetch error:", error)
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 })
  }
}
