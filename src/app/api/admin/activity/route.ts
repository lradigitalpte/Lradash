import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"
import { TaskModel } from "@/models/task.model"

/**
 * GET /api/admin/activity
 * Returns the 50 most recent task activities (comments & updates) across the org.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const { orgId } = guard

  await connectToDatabase()

  // Fetch tasks that have recent activities
  const tasks = await TaskModel.find({
    organizationId: orgId,
    deletedAt: null,
    "activities.0": { $exists: true }
  })
    .select("_id title project board activities")
    .populate("project", "title")
    .populate("activities.user", "name email avatar")
    .sort({ updatedAt: -1 })
    .limit(30)
    .lean()

  // Flatten activities, stamp with task info, sort by date desc
  const allActivities: any[] = []
  for (const task of tasks) {
    for (const activity of (task as any).activities ?? []) {
      allActivities.push({
        _id: activity._id?.toString(),
        type: activity.type,
        text: activity.text,
        createdAt: activity.createdAt,
        user: activity.user,
        task: {
          _id: (task as any)._id.toString(),
          title: (task as any).title,
          project: (task as any).project
        }
      })
    }
  }

  allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return NextResponse.json({ activities: allActivities.slice(0, 50) })
}
