import { NextRequest, NextResponse } from "next/server"

import { extractTokenFromHeader, verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { dispatchNotification } from "@/lib/notifications/dispatcher"
import { TaskModel } from "@/models/task.model"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const cronSecret = process.env.CRON_SECRET

  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization")
  const token = extractTokenFromHeader(authHeader)
  const isAuthenticated = token ? !!verifyAccessToken(token) : false

  if (process.env.NODE_ENV === "production") {
    if (!isAuthenticated && (!cronSecret || key !== cronSecret)) {
      return new Response("Unauthorized", { status: 401 })
    }
  } else if (!isAuthenticated && cronSecret && key !== cronSecret) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    await connectToDatabase()

    const now = new Date()
    const reminderCutoff = new Date(now.getTime() + 12 * 60 * 60 * 1000)

    const tasks = await TaskModel.find({
      dueDate: { $gt: now, $lte: reminderCutoff },
      assignee: { $ne: null },
      deletedAt: null,
      isArchived: false,
      status: { $ne: "DONE" },
      $or: [{ deadlineReminder12hSentAt: { $exists: false } }, { deadlineReminder12hSentAt: null }]
    })
      .populate([
        {
          path: "assignee",
          select: "name email notificationEmail avatar preferences.emailNotifications"
        },
        { path: "creator", select: "name email avatar" },
        { path: "project", select: "name title" }
      ])
      .limit(100)
      .lean()

    let reminded = 0
    let skipped = 0

    for (const task of tasks as any[]) {
      const assignee = task.assignee
      const recipientEmail = getNotificationEmail(assignee)
      if (!recipientEmail) {
        skipped += 1
        continue
      }

      const projectName = task.project?.name || task.project?.title || undefined

      dispatchNotification({
        recipientUserId: String(assignee._id),
        type: "task_deadline_reminder",
        title: `Deadline Soon: ${task.title}`,
        body: `"${task.title}" is due in less than 12 hours${projectName ? ` in ${projectName}` : ""}.`,
        taskId: String(task._id),
        projectId: task.project?._id ? String(task.project._id) : undefined,
        triggeredBy: {
          userId: String(task.creator?._id || "system"),
          name: "LRA Dashboard",
          avatar: undefined
        },
        email: {
          recipientEmail,
          recipientName: assignee.name ?? assignee.email,
          taskTitle: task.title,
          taskDescription: task.description,
          taskStatus: task.status,
          taskPriority: task.priority,
          taskDueDate: task.dueDate ? new Date(task.dueDate).toLocaleString() : undefined,
          projectName
        }
      }).catch(() => {})

      await TaskModel.updateOne(
        { _id: task._id },
        { $set: { deadlineReminder12hSentAt: new Date() } }
      )

      reminded += 1
    }

    return NextResponse.json({
      scanned: tasks.length,
      reminded,
      skipped,
      windowHours: 12
    })
  } catch (error: any) {
    console.error("Task deadline reminder cron error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to process reminders" },
      { status: 500 }
    )
  }
}
