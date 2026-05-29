"use server"

import { Types } from "mongoose"

import { getAccessibleProjectIdsForUser } from "@/lib/board-access"
import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { TaskModel, TaskType } from "@/models/task.model"
import { Task, TaskStatus, TaskPriority } from "@/types/dbInterface"

import { connectToDatabase } from "./connect"
import { getUserByEmail, getUserById } from "./user"

// Define a base interface for both Mongoose documents and plain objects
interface TaskBase {
  _id: Types.ObjectId | string
  title: string
  description?: string
  status: TaskStatus
  dueDate?: Date
  organizationId: Types.ObjectId | string
  board?: Types.ObjectId | string
  project?: Types.ObjectId | string
  assignee?: Types.ObjectId | string | { id: string; name: string }
  creator: Types.ObjectId | string | { id: string; name: string }
  lastModifier: Types.ObjectId | string | { id: string; name: string }
  priority?: string
  isArchived?: boolean
  createdAt: Date | string
  updatedAt: Date | string
  __v?: number
}

interface PopulatedUserSummary {
  _id: Types.ObjectId | string
  name: string
  avatar?: string | null
}

interface PopulatedProjectSummary {
  _id: Types.ObjectId | string
  title: string
}

interface WorkspaceTaskRecord extends Omit<
  TaskBase,
  "project" | "assignee" | "creator" | "lastModifier"
> {
  project?: Types.ObjectId | string | PopulatedProjectSummary | null
  assignee?: Types.ObjectId | string | PopulatedUserSummary | null
  assignees?: Array<Types.ObjectId | string | PopulatedUserSummary>
  creator: Types.ObjectId | string | PopulatedUserSummary
  lastModifier: Types.ObjectId | string | PopulatedUserSummary
  checklist?: Task["checklist"]
  labels?: Task["labels"]
  attachments?: Task["attachments"]
  coverColor?: string
}

async function convertTaskToPlainObject(taskDoc: TaskBase): Promise<TaskType> {
  if (!taskDoc) {
    throw new Error("Task document is undefined")
  }
  const getObjectIdString = (
    id: Types.ObjectId | string | { id: string } | null | undefined
  ): string => {
    if (!id) {
      return ""
    }
    if (id instanceof Types.ObjectId) {
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

  const assigneesIds = Array.isArray((taskDoc as any).assignees)
    ? (taskDoc as any).assignees.map((id: any) => getObjectIdString(id))
    : []

  const [assigneeUser, creatorUser, modifierUser, assigneesUsers] = await Promise.all([
    assigneeId ? getUserById(assigneeId) : Promise.resolve(null),
    getUserById(creatorId),
    getUserById(modifierId),
    assigneesIds.length > 0
      ? Promise.all(assigneesIds.map(async (id: string) => getUserById(id)))
      : Promise.resolve([])
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
    status: taskDoc.status || TaskStatus.TODO,
    dueDate: taskDoc.dueDate,
    organizationId,
    board: boardId,
    project: projectId,
    assignee:
      assigneeUser && assigneeId
        ? {
            id: assigneeId,
            name: assigneeUser.name,
            avatar: assigneeUser.avatar || undefined
          }
        : undefined,
    assignees: assigneesUsers
      .filter((u): u is any => !!u)
      .map((u) => ({
        id: u._id.toString(),
        name: u.name,
        avatar: u.avatar || undefined
      })),
    isBackdated: (taskDoc as any).isBackdated || false,
    creator: {
      id: creatorId,
      name: creatorUser.name,
      avatar: creatorUser.avatar || undefined
    },
    lastModifier: {
      id: modifierId,
      name: modifierUser.name,
      avatar: modifierUser.avatar || undefined
    },
    priority: (taskDoc.priority as TaskPriority) || TaskPriority.MEDIUM,
    isArchived: taskDoc.isArchived || false,
    checklist: (taskDoc as any).checklist || [],
    labels: Array.isArray((taskDoc as any).labels)
      ? ((taskDoc as any).labels as any[]).map((label) => ({
          name: typeof label?.name === "string" ? label.name : String(label?.name ?? ""),
          color: typeof label?.color === "string" ? label.color : String(label?.color ?? ""),
          ...(label?._id != null
            ? { _id: getObjectIdString(label._id) }
            : label?.id != null
              ? { id: String(label.id) }
              : {})
        }))
      : [],
    activities: (taskDoc as any).activities
      ? await Promise.all(
          ((taskDoc as any).activities as any[]).map(async (a: any) => {
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
    attachments: (taskDoc as any).attachments || [],
    coverColor: (taskDoc as any).coverColor,
    createdAt:
      typeof taskDoc.createdAt === "string" ? new Date(taskDoc.createdAt) : taskDoc.createdAt,
    updatedAt:
      typeof taskDoc.updatedAt === "string" ? new Date(taskDoc.updatedAt) : taskDoc.updatedAt
  }
}

function toUserInfo(user?: Types.ObjectId | string | PopulatedUserSummary | null) {
  if (!user) {
    return undefined
  }

  if (typeof user === "object" && "name" in user && "_id" in user) {
    return {
      id: String(user._id),
      name: user.name,
      avatar: user.avatar || undefined
    }
  }

  return undefined
}

function convertWorkspaceTaskToPlainObject(taskDoc: WorkspaceTaskRecord): TaskType & {
  projectTitle?: string
  projectId?: string
} {
  const projectInfo =
    taskDoc.project && typeof taskDoc.project === "object" && "title" in taskDoc.project
      ? taskDoc.project
      : null

  const assignee = toUserInfo(taskDoc.assignee)
  const assignees = Array.isArray(taskDoc.assignees)
    ? taskDoc.assignees
        .map((user) => toUserInfo(user))
        .filter((user): user is NonNullable<typeof user> => !!user)
    : []
  const creator = toUserInfo(taskDoc.creator)
  const lastModifier = toUserInfo(taskDoc.lastModifier)

  if (!creator || !lastModifier) {
    throw new Error("Workspace task is missing populated creator or lastModifier")
  }

  return {
    _id: String(taskDoc._id),
    title: taskDoc.title,
    description: taskDoc.description || "",
    status: taskDoc.status || TaskStatus.TODO,
    dueDate: taskDoc.dueDate,
    organizationId: String(taskDoc.organizationId),
    board: taskDoc.board ? String(taskDoc.board) : undefined,
    project: projectInfo
      ? String(projectInfo._id)
      : taskDoc.project
        ? String(taskDoc.project)
        : undefined,
    projectId: projectInfo
      ? String(projectInfo._id)
      : taskDoc.project
        ? String(taskDoc.project)
        : undefined,
    projectTitle: projectInfo?.title || "Personal task",
    assignee,
    assignees,
    isBackdated: Boolean((taskDoc as any).isBackdated),
    creator,
    lastModifier,
    priority: (taskDoc.priority as TaskPriority) || TaskPriority.MEDIUM,
    isArchived: taskDoc.isArchived || false,
    checklist: taskDoc.checklist || [],
    labels: taskDoc.labels || [],
    attachments: taskDoc.attachments || [],
    coverColor: taskDoc.coverColor,
    createdAt:
      typeof taskDoc.createdAt === "string" ? new Date(taskDoc.createdAt) : taskDoc.createdAt,
    updatedAt:
      typeof taskDoc.updatedAt === "string" ? new Date(taskDoc.updatedAt) : taskDoc.updatedAt
  }
}

// ... helper functions (keep them)
async function getBoardByProjectId(projectId: string): Promise<string | undefined> {
  try {
    await connectToDatabase()
    const project = await ProjectModel.findById(projectId)
    return project?.board?.toString()
  } catch (error) {
    console.error("Error fetching board:", error)
    throw error
  }
}

export async function getTaskById(taskId: string): Promise<Task> {
  try {
    await connectToDatabase()
    const task = await TaskModel.findOne({ _id: taskId, deletedAt: null })
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }
    return await convertTaskToPlainObject(task as any)
  } catch (error) {
    console.error("Error fetching task by id:", error)
    throw error
  }
}

export async function getTasksByProjectId(projectId: string): Promise<Task[]> {
  try {
    await connectToDatabase()
    // Filter out deleted tasks (where deletedAt is null or doesn't exist)
    const tasks = await TaskModel.find({ project: projectId, deletedAt: null }).lean()
    const taskPromises = tasks.map(async (task) => convertTaskToPlainObject(task as TaskBase))
    return await Promise.all(taskPromises)
  } catch (error) {
    console.error("Error fetching tasks:", error)
    throw error
  }
}

async function ensureUserIsMember(projectId: string, userId: string): Promise<void> {
  const project = await ProjectModel.findById(projectId)
  if (!project) {
    throw new Error("Project not found")
  }

  const getObjectIdString = (id: any): string => {
    if (!id) {
      return ""
    }
    if (id instanceof Types.ObjectId) {
      return id.toHexString()
    }
    return String(id)
  }

  const isProjectMember = project.members.some((member) => getObjectIdString(member) === userId)

  if (!isProjectMember) {
    await ProjectModel.findByIdAndUpdate(projectId, {
      $addToSet: { members: userId }
    })
  }

  // Only sync board membership if this project has an associated board
  const boardId = (project as any).board
  if (boardId) {
    const board = await BoardModel.findById(boardId)
    if (board) {
      const isBoardMember = board.members.some((member) => getObjectIdString(member) === userId)
      if (!isBoardMember) {
        await BoardModel.findByIdAndUpdate(boardId, {
          $addToSet: { members: userId }
        })
      }
    }
  }
}

export async function createTaskInDb(
  projectId: string,
  title: string,
  userEmail: string,
  description?: string,
  dueDate?: Date,
  assigneeId?: string,
  status: "TODO" | "IN_PROGRESS" | "DONE" = "TODO",
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM"
): Promise<Task> {
  try {
    await connectToDatabase()
    const creator = await getUserByEmail(userEmail)
    if (!creator) {
      throw new Error("Creator not found")
    }

    const boardId = await getBoardByProjectId(projectId)
    if (!boardId) {
      throw new Error("Board not found")
    }

    if (assigneeId) {
      await ensureUserIsMember(projectId, assigneeId)
    }

    const taskData: any = {
      title,
      description,
      status,
      dueDate,
      priority,
      board: boardId,
      project: projectId,
      assignee: assigneeId,
      creator: creator._id,
      lastModifier: creator._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      organizationId: creator.defaultOrganizationId,
      // Add initial activity log
      activities: [
        {
          user: creator._id,
          type: "activity",
          text: `Task created by ${creator.name}`,
          createdAt: new Date()
        }
      ]
    }

    const newTask = await TaskModel.create(taskData)
    return await convertTaskToPlainObject(newTask.toObject() as any)
  } catch (error) {
    console.error("Error creating task:", error)
    throw error
  }
}

export async function updateTaskInDb(
  taskId: string,
  userEmail: string,
  updates: Partial<Task>
): Promise<Task> {
  try {
    await connectToDatabase()
    const modifier = await getUserByEmail(userEmail)
    if (!modifier) {
      throw new Error("Modifier not found")
    }
    const task = await TaskModel.findById(taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    if (updates.assignee && typeof updates.assignee === "string") {
      await ensureUserIsMember((task as any).project.toString(), updates.assignee)
    }
    if (Array.isArray((updates as any).assignees)) {
      for (const raw of (updates as any).assignees) {
        const assigneeId = typeof raw === "string" ? raw : raw?.id ? raw.id : String(raw)
        if (assigneeId) {
          await ensureUserIsMember((task as any).project.toString(), assigneeId)
        }
      }
    }

    const taskUpdates: any = {
      ...updates,
      lastModifier: modifier._id,
      updatedAt: new Date()
    }

    // Remove fields that shouldn't be updated
    delete taskUpdates.creator
    delete taskUpdates._id
    delete taskUpdates.createdAt

    // Ensure assignee is an ObjectId
    if (taskUpdates.assignee) {
      if (typeof taskUpdates.assignee === "string") {
        taskUpdates.assignee = new Types.ObjectId(taskUpdates.assignee)
      } else if (typeof taskUpdates.assignee === "object" && taskUpdates.assignee?.id) {
        // If assignee comes as an object with id property, extract the id
        taskUpdates.assignee = new Types.ObjectId(taskUpdates.assignee.id)
      }
    }
    if (Array.isArray(taskUpdates.assignees)) {
      taskUpdates.assignees = taskUpdates.assignees
        .map((assignee: any) => {
          const id =
            typeof assignee === "string" ? assignee : assignee?.id ? assignee.id : String(assignee)
          return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null
        })
        .filter(Boolean)
      // Keep backward compatibility for places still reading single assignee.
      taskUpdates.assignee = taskUpdates.assignees[0] || undefined
    }

    // Handle activities array - always ensure it's set
    let updatedActivities = Array.isArray(taskUpdates.activities)
      ? [...taskUpdates.activities]
      : [...((task as any).activities || [])]

    // Map activity user references to ObjectIds
    updatedActivities = updatedActivities.map((a: any) => ({
      ...a,
      user:
        typeof a.user === "string"
          ? new Types.ObjectId(a.user)
          : a.user?.id
            ? new Types.ObjectId(a.user.id)
            : a.user instanceof Types.ObjectId
              ? a.user
              : new Types.ObjectId(String(a.user))
    }))

    // Log status changes as activities
    if (updates.status && updates.status !== (task as any).status) {
      const statusMap: { [key: string]: string } = {
        TODO: "To Do",
        IN_PROGRESS: "In Progress",
        DONE: "Completed",
        ARCHIVED: "Archived"
      }
      const newStatusLabel = statusMap[updates.status] || updates.status
      const activityEntry = {
        user: modifier._id,
        type: "activity",
        text: `Status changed to ${newStatusLabel} by ${modifier.name}`,
        createdAt: new Date()
      }
      updatedActivities.push(activityEntry)
    }

    // Log assignee changes
    if (updates.assignee && updates.assignee !== (task as any).assignee) {
      const assigneeId =
        typeof updates.assignee === "string"
          ? updates.assignee
          : updates.assignee?.id
            ? updates.assignee.id
            : String(updates.assignee)
      const assigneeUser = await getUserById(assigneeId)
      const activityEntry = {
        user: modifier._id,
        type: "activity",
        text: `Assigned to ${assigneeUser?.name || "Unknown"} by ${modifier.name}`,
        createdAt: new Date()
      }
      updatedActivities.push(activityEntry)
    }
    if (Array.isArray((updates as any).assignees)) {
      const names: string[] = []
      for (const raw of (updates as any).assignees) {
        const id = typeof raw === "string" ? raw : raw?.id ? raw.id : String(raw)
        const u = await getUserById(id)
        if (u?.name) {
          names.push(u.name)
        }
      }
      updatedActivities.push({
        user: modifier._id,
        type: "activity",
        text:
          names.length > 0
            ? `Assigned to ${names.join(", ")} by ${modifier.name}`
            : `Assignees cleared by ${modifier.name}`,
        createdAt: new Date()
      })
    }

    // Always set activities in taskUpdates
    taskUpdates.activities = updatedActivities

    console.log("📝 Updating task activities:", {
      taskId,
      totalActivities: updatedActivities.length,
      newActivities: updatedActivities.slice(-2).map((a) => ({ type: a.type, text: a.text }))
    })

    const updatedTask = await TaskModel.findByIdAndUpdate(taskId, taskUpdates, { new: true })

    if (!updatedTask) {
      throw new Error("Task not found")
    }

    return await convertTaskToPlainObject(updatedTask.toObject() as any)
  } catch (error) {
    console.error("Error updating task:", error)
    throw error
  }
}

export async function updateTaskProjectInDb(
  userEmail: string,
  taskId: string,
  newProjectId: string
): Promise<Task> {
  try {
    await connectToDatabase()

    const user = await getUserByEmail(userEmail)
    if (!user) {
      throw new Error("User not found")
    }

    const targetProject = await ProjectModel.findById(newProjectId)
    if (!targetProject) {
      throw new Error("Target project not found")
    }

    const task = await TaskModel.findById(taskId)
    if (!task) {
      throw new Error("Task not found")
    }

    const getObjectIdString = (id: any): string => {
      if (!id) {
        return ""
      }
      if (id instanceof Types.ObjectId) {
        return id.toHexString()
      }
      return String(id)
    }

    const isTargetProjectOwner = getObjectIdString(targetProject.owner) === user._id.toString()
    const isTargetProjectMember = targetProject.members.some(
      (member: any) => getObjectIdString(member) === user._id.toString()
    )
    const isTaskCreator = getObjectIdString((task as any).creator) === user._id.toString()
    const isTaskAssignee = (task as any).assignee
      ? getObjectIdString((task as any).assignee) === user._id.toString()
      : false

    if (!(isTargetProjectOwner || (isTargetProjectMember && (isTaskCreator || isTaskAssignee)))) {
      throw new Error("Permission denied: You do not have sufficient permissions to move this task")
    }

    const updatedTask = await TaskModel.findByIdAndUpdate(
      taskId,
      {
        project: new Types.ObjectId(newProjectId),
        lastModifier: user._id,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!updatedTask) {
      throw new Error("Failed to update task")
    }

    return await convertTaskToPlainObject(updatedTask.toObject() as any)
  } catch (error) {
    console.error("Error updating task project:", error)
    throw error
  }
}

export async function deleteTaskInDb(taskId: string): Promise<void> {
  try {
    await connectToDatabase()
    const task = await TaskModel.findById(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }

    // Soft delete by adding deletion activity and marking as deleted
    const deletionActivity = {
      user: (task as any).lastModifier,
      type: "activity",
      text: "Task deleted",
      createdAt: new Date()
    }

    await TaskModel.findByIdAndUpdate(taskId, {
      deletedAt: new Date(),
      activities: [...((task as any).activities || []), deletionActivity]
    })
  } catch (error) {
    console.error("Error deleting task:", error)
    throw error
  }
}

/**
 * Get tasks for the workspace list: created by the user, assigned to them, or in `assignees`,
 * limited to the org and to projects the user can access (owner/member) plus personal tasks
 * (no project). Newest first by `updatedAt` / `createdAt`.
 */
export async function getAllUserTasks(userEmail: string): Promise<Task[]> {
  try {
    await connectToDatabase()
    const user = await getUserByEmail(userEmail)
    if (!user) {
      throw new Error("User not found")
    }

    const organizationId = user.defaultOrganizationId
    if (!organizationId) {
      return []
    }

    const userOid = new Types.ObjectId(String(user._id))

    const accessibleProjectIds = await getAccessibleProjectIdsForUser(
      userOid.toString(),
      organizationId
    )
    const projectObjectIds = accessibleProjectIds.map((id) => new Types.ObjectId(id))

    const inAccessibleProjectOrPersonal =
      projectObjectIds.length > 0
        ? {
            $or: [
              { project: { $in: projectObjectIds } },
              { project: null },
              { project: { $exists: false } }
            ]
          }
        : {
            $or: [{ project: null }, { project: { $exists: false } }]
          }

    const tasks = await TaskModel.find({
      organizationId,
      deletedAt: null,
      isArchived: false,
      $and: [
        inAccessibleProjectOrPersonal,
        {
          $or: [{ creator: userOid }, { assignee: userOid }, { assignees: userOid }]
        }
      ]
    } as any)
      .select(
        "title description status dueDate organizationId board project assignee assignees isBackdated creator lastModifier priority isArchived checklist labels attachments coverColor createdAt updatedAt"
      )
      .populate("project", "title")
      .populate("assignee", "name avatar")
      .populate("assignees", "name avatar")
      .populate("creator", "name avatar")
      .populate("lastModifier", "name avatar")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean()

    return tasks.map((task) =>
      convertWorkspaceTaskToPlainObject(task as unknown as WorkspaceTaskRecord)
    )
  } catch (error) {
    console.error("Error fetching user tasks:", error)
    throw error
  }
}

/**
 * Create a personal task (not tied to a specific project)
 */
export async function createPersonalTask(
  userEmail: string,
  title: string,
  description?: string,
  dueDate?: Date,
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM",
  status: "TODO" | "IN_PROGRESS" | "DONE" = "TODO"
): Promise<Task> {
  try {
    await connectToDatabase()
    const creator = await getUserByEmail(userEmail)
    if (!creator) {
      throw new Error("Creator not found")
    }

    const organizationId = creator.defaultOrganizationId
    if (!organizationId) {
      throw new Error("User must belong to an organization")
    }

    const now = new Date()
    const taskData: any = {
      title,
      description,
      status,
      dueDate,
      priority,
      organizationId,
      // No board or project for personal tasks
      creator: creator._id,
      lastModifier: creator._id,
      createdAt: now,
      updatedAt: now,
      // Add initial activity log
      activities: [
        {
          user: creator._id,
          type: "activity",
          text: `Task created by ${creator.name}`,
          createdAt: now
        }
      ]
    }

    const newTask = await TaskModel.create(taskData)
    return await convertTaskToPlainObject(newTask.toObject() as any)
  } catch (error) {
    console.error("Error creating personal task:", error)
    throw error
  }
}
