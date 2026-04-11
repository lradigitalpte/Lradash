import mongoose from "mongoose"

import { ProjectModel } from "@/models/project.model"

const MAX_ID_DEPTH = 24

const is24Hex = (s: string) => /^[a-fA-F0-9]{24}$/.test(s)

/**
 * Normalize Mongo/ObjectId-like values to a string id.
 * Handles ObjectId before `_id` recursion so we never spin on cycles (e.g. a._id ↔ b._id).
 */
export const toIdString = (value: unknown, depth = 0, seen?: WeakSet<object>): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === "string") {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value !== "object") {
    return null
  }

  if (depth > MAX_ID_DEPTH) {
    return null
  }

  // BSON / Mongoose ObjectId — before visited/_id unwrap (avoids cycles & stack overflow)
  if (value instanceof mongoose.Types.ObjectId) {
    return value.toHexString()
  }

  const maybeHex = value as { toHexString?: () => string }
  if (typeof maybeHex.toHexString === "function") {
    try {
      const hex = maybeHex.toHexString()
      if (typeof hex === "string" && is24Hex(hex)) {
        return hex
      }
    } catch {
      /* ignore */
    }
  }

  const obj = value
  const visited = seen ?? new WeakSet<object>()
  if (visited.has(obj)) {
    return null
  }
  visited.add(obj)

  const record = value as {
    _id?: unknown
    id?: unknown
    toString?: () => string
  }

  if (record._id !== undefined && record._id !== value) {
    const nested = toIdString(record._id, depth + 1, visited)
    if (nested) {
      return nested
    }
  }

  if (record.id !== undefined && record.id !== value) {
    const nested = toIdString(record.id, depth + 1, visited)
    if (nested) {
      return nested
    }
  }

  if (typeof record.toString === "function") {
    const stringValue = record.toString()
    if (stringValue && stringValue !== "[object Object]") {
      return stringValue
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
