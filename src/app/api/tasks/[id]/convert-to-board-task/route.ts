import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { createTaskInDb } from "@/lib/db/task"
import { getUserByEmail, getUserById } from "@/lib/db/user"
import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { TaskModel, TaskType } from "@/models/task.model"

interface ConvertTaskRequest {
  projectId: string
}

/**
 * POST /api/tasks/[id]/convert-to-board-task
 * Convert a personal task to a board task
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || (!decoded.userId && !decoded.email)) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { id: taskId } = await params
    const body: ConvertTaskRequest = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Connect to database
    await connectToDatabase()

    // Get the original task
    const originalTask = await TaskModel.findById(taskId)
    if (!originalTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Verify the task is a personal task (no project)
    if (originalTask.project) {
      return NextResponse.json({ error: "Task is already a board task" }, { status: 400 })
    }

    // Get the project
    const project = await ProjectModel.findById(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get the user
    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has permission to access the project
    const isProjectOwner = project.owner.toString() === user._id.toString()
    const isProjectMember = project.members.some(
      (member: any) => member.toString() === user._id.toString()
    )

    if (!isProjectOwner && !isProjectMember) {
      return NextResponse.json(
        { error: "You don't have permission to access this project" },
        { status: 403 }
      )
    }

    // Get or create a board for the project
    let board = await BoardModel.findOne({ projectId: projectId })
    if (!board) {
      // Create a new board for the project
      board = await BoardModel.create({
        title: `${project.title} Board`,
        projectId: projectId,
        organizationId: user.defaultOrganizationId,
        owner: user._id,
        listIds: []
      } as any)
    }

    // Update the task to be a board task
    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      {
        project: projectId,
        board: board._id,
        organizationId: user.defaultOrganizationId,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedTask) {
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }

    // Add activity log for the conversion
    const activity = {
      user: user._id,
      type: "activity",
      text: `Task converted to board task and moved to ${project.title}`,
      createdAt: new Date()
    }

    if (!updatedTask.activities) {
      updatedTask.activities = []
    }
    updatedTask.activities.push(activity as any)
    await updatedTask.save()

    // Fetch the updated task with all populated fields
    const populatedTask = await TaskModel.findById(taskId)
      .populate("assignee", "name email avatar")
      .populate("creator", "name email avatar")
      .populate("lastModifier", "name email avatar")
      .populate("board", "name columns")
      .populate("project", "title")

    // Convert to plain object
    const taskPlainObject = await convertTaskToPlainObject(populatedTask as any)

    return NextResponse.json(taskPlainObject)
  } catch (error: any) {
    console.error("Convert to board task error:", error)
    return NextResponse.json({ error: error.message || "Failed to convert task" }, { status: 500 })
  }
}

// Helper function to convert task document to plain object
async function convertTaskToPlainObject(taskDoc: any): Promise<TaskType> {
  if (!taskDoc) {
    throw new Error("Task document is undefined")
  }

  const getObjectIdString = (id: any): string => {
    if (!id) {
      return ""
    }
    if (id instanceof require("mongoose").Types.ObjectId) {
      return id.toHexString()
    }
    if (typeof id === "object" && "id" in id) {
      return id.id
    }
    return String(id)
  }

  const creatorId = getObjectIdString(taskDoc.creator)
  const modifierId = getObjectIdString(taskDoc.lastModifier)

  if (!creatorId || !modifierId) {
    throw new Error(
      `Task document missing required fields: creator (${JSON.stringify(taskDoc.creator)}) or lastModifier (${JSON.stringify(taskDoc.lastModifier)})`
    )
  }

  const assigneeId = taskDoc.assignee ? getObjectIdString(taskDoc.assignee) : undefined

  const [assigneeUser, creatorUser, modifierUser] = await Promise.all([
    assigneeId ? getUserById(assigneeId) : Promise.resolve(null),
    getUserById(creatorId),
    getUserById(modifierId)
  ])

  if (!creatorUser || !modifierUser) {
    throw new Error("Unable to find creator or modifier user data")
  }

  const boardId = taskDoc.board ? getObjectIdString(taskDoc.board) : undefined
  const projectId = taskDoc.project ? getObjectIdString(taskDoc.project) : undefined
  const docId = getObjectIdString(taskDoc._id)
  const organizationId = getObjectIdString(taskDoc.organizationId)

  return {
    _id: docId,
    title: taskDoc.title,
    description: taskDoc.description || "",
    status: taskDoc.status,
    dueDate: taskDoc.dueDate,
    organizationId,
    board: boardId,
    project: projectId,
    assignee:
      assigneeUser && assigneeId
        ? {
            id: assigneeId,
            name: assigneeUser.name,
            email: assigneeUser.email,
            avatar: assigneeUser.avatar
          }
        : undefined,
    creator: {
      id: creatorId,
      name: creatorUser.name,
      email: creatorUser.email,
      avatar: creatorUser.avatar
    },
    lastModifier: {
      id: modifierId,
      name: modifierUser.name,
      email: modifierUser.email,
      avatar: modifierUser.avatar
    },
    priority: taskDoc.priority,
    isArchived: taskDoc.isArchived || false,
    checklist: taskDoc.checklist || [],
    labels: taskDoc.labels || [],
    activities: taskDoc.activities
      ? await Promise.all(
          (taskDoc.activities as any[]).map(async (a: any) => {
            const u = await getUserById(getObjectIdString(a.user))
            return {
              _id: getObjectIdString(a._id),
              user: { id: getObjectIdString(a.user), name: u?.name || "System" },
              type: a.type,
              text: a.text,
              createdAt: a.createdAt
            }
          })
        )
      : [],
    attachments: taskDoc.attachments || [],
    coverColor: taskDoc.coverColor,
    createdAt: taskDoc.createdAt,
    updatedAt: taskDoc.updatedAt
  }
}
