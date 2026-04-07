import mongoose from "mongoose"

import { ProjectModel } from "@/models/project.model"

export const toIdString = (value: unknown): string | null => {
  if (!value) {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "object") {
    const record = value as {
      _id?: unknown
      id?: unknown
      toString?: () => string
    }

    if (record._id) {
      return toIdString(record._id)
    }

    if (record.id) {
      return toIdString(record.id)
    }

    if (typeof record.toString === "function") {
      const stringValue = record.toString()
      if (stringValue && stringValue !== "[object Object]") {
        return stringValue
      }
    }
  }

  return null
}

const uniqueIds = (values: unknown[]): string[] =>
  Array.from(
    new Set(values.map((value) => toIdString(value)).filter((value): value is string => !!value))
  )

export async function getProjectAccessContext(projectId: unknown) {
  const normalizedProjectId = toIdString(projectId)

  if (!normalizedProjectId || !mongoose.Types.ObjectId.isValid(normalizedProjectId)) {
    return null
  }

  const project = await ProjectModel.findOne({
    _id: normalizedProjectId,
    deletedAt: null
  })
    .select("owner members")
    .lean()

  if (!project) {
    return null
  }

  return {
    ownerId: toIdString((project as any).owner),
    memberIds: uniqueIds([...((project as any).members || []), (project as any).owner])
  }
}

export async function canAccessBoard(board: any, userId?: string | null): Promise<boolean> {
  if (!userId) {
    return false
  }

  const directAccessIds = uniqueIds([board?.owner, ...(board?.members || [])])
  if (directAccessIds.includes(userId)) {
    return true
  }

  const projectContext = await getProjectAccessContext(board?.projectId)
  return projectContext?.memberIds.includes(userId) ?? false
}

export async function canManageBoard(board: any, userId?: string | null): Promise<boolean> {
  if (!userId) {
    return false
  }

  if (toIdString(board?.owner) === userId) {
    return true
  }

  const projectContext = await getProjectAccessContext(board?.projectId)
  return projectContext?.ownerId === userId
}

export async function getAccessibleProjectIdsForUser(
  userId: string,
  organizationId?: unknown
): Promise<string[]> {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return []
  }

  const normalizedOrganizationId = toIdString(organizationId)
  const query: Record<string, unknown> = {
    deletedAt: null,
    $or: [
      { owner: new mongoose.Types.ObjectId(userId) },
      { members: new mongoose.Types.ObjectId(userId) }
    ]
  }

  if (normalizedOrganizationId && mongoose.Types.ObjectId.isValid(normalizedOrganizationId)) {
    query.organizationId = new mongoose.Types.ObjectId(normalizedOrganizationId)
  }

  const projects = await ProjectModel.find(query).select("_id").lean()
  return projects.map((project: any) => project._id.toString())
}
