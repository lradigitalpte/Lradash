import "@/models/workpackage.model"

import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { dispatchNotification } from "@/lib/notifications/dispatcher"
import { parseRecordedCreatedAt } from "@/lib/tasks/recorded-created-at"
import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const { projectId } = await params
    const body = await request.json()

    // Verify project exists
    const project = await ProjectModel.findById(projectId)
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get user info for creator and lastModifier
    const user = await UserModel.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const recorded = parseRecordedCreatedAt(body.recordedCreatedAt)
    if (recorded.error) {
      return NextResponse.json(
        { error: recorded.error },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const now = new Date()
    const taskPayload: Record<string, unknown> = {
      title: body.title,
      description: body.description,
      status: body.status || "TODO",
      priority: body.priority || "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      project: projectId,
      workPackage: body.workPackageId || undefined,
      organizationId: project.organizationId,
      creator: decoded.userId,
      lastModifier: decoded.userId,
      assignee: body.assigneeId || undefined
    }

    if (recorded.date) {
      taskPayload.createdAt = recorded.date
      taskPayload.updatedAt = now
    }

    const task = new TaskModel(taskPayload)
    await task.save()

    // Populate related fields
    await task.populate([
      { path: "assignee", select: "name avatar email" },
      { path: "creator", select: "name avatar email" },
      { path: "lastModifier", select: "name avatar email" },
      { path: "workPackage", select: "title" }
    ])

    const projectName = (project as any).name || (project as any).title || ""
    const taskTitle = body.title

    // Fire-and-forget: notify only the assignee if different from creator
    if (body.assigneeId && String(body.assigneeId) !== String(user._id)) {
      const assignee = (await UserModel.findById(body.assigneeId)
        .select("name email notificationEmail avatar")
        .lean()) as any
      if (assignee?.email) {
        dispatchNotification({
          recipientUserId: String(assignee._id),
          type: "task_created",
          title: `New Task: ${taskTitle}`,
          body: `${user.name ?? user.email} created and assigned you "${taskTitle}"${projectName ? ` in ${projectName}` : ""}.`,
          taskId: String(task._id),
          projectId,
          triggeredBy: {
            userId: String(user._id),
            name: user.name ?? user.email,
            avatar: user.avatar ?? undefined
          },
          email: {
            recipientEmail: getNotificationEmail(assignee),
            recipientName: assignee.name ?? assignee.email,
            taskTitle,
            taskDescription: body.description,
            taskStatus: body.status || "TODO",
            taskPriority: body.priority || "MEDIUM",
            taskDueDate: body.dueDate ? new Date(body.dueDate).toLocaleDateString() : undefined,
            projectName
          }
        }).catch(() => {})
      }
    }

    return NextResponse.json(task, {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const { projectId } = await params

    // Verify project exists
    const project = await ProjectModel.findById(projectId)
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Fetch all non-deleted tasks for this project
    const tasks = await TaskModel.find({
      project: projectId,
      deletedAt: null
    })
      .populate([
        { path: "assignee", select: "name avatar email" },
        { path: "creator", select: "name avatar email" },
        { path: "lastModifier", select: "name avatar email" },
        { path: "workPackage", select: "title status priority" }
      ])
      .sort({ createdAt: -1 })

    return NextResponse.json(tasks, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Fetch tasks error:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
