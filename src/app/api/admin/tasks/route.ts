import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"
import { TaskModel } from "@/models/task.model"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const { orgId, user } = guard
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page") || 1))
  const limit = Math.min(50, Math.max(5, Number(searchParams.get("limit") || 10)))
  const q = (searchParams.get("q") || "").trim()
  const mine = searchParams.get("mine") === "1"
  const sort = searchParams.get("sort") === "created_asc" ? "created_asc" : "created_desc"
  const projectId = (searchParams.get("projectId") || "").trim()
  const assigneeId = (searchParams.get("assigneeId") || "").trim()
  const dateFrom = (searchParams.get("dateFrom") || "").trim()
  const dateTo = (searchParams.get("dateTo") || "").trim()
  const hasAttachments = searchParams.get("hasAttachments") === "1"

  await connectToDatabase()

  const query: Record<string, unknown> = {
    organizationId: orgId,
    deletedAt: null,
    project: { $exists: true, $ne: null }
  }
  const andClauses: Record<string, unknown>[] = []

  if (q) {
    andClauses.push({
      $or: [{ title: { $regex: q, $options: "i" } }, { description: { $regex: q, $options: "i" } }]
    })
  }
  if (mine) {
    andClauses.push({ $or: [{ assignee: user._id }, { assignees: user._id }] })
  }
  if (projectId) {
    query.project = projectId
  }
  if (assigneeId) {
    andClauses.push({ $or: [{ assignee: assigneeId }, { assignees: assigneeId }] })
  }
  if (dateFrom || dateTo) {
    const createdAtRange: Record<string, Date> = {}
    if (dateFrom) {
      createdAtRange.$gte = new Date(`${dateFrom}T00:00:00.000Z`)
    }
    if (dateTo) {
      createdAtRange.$lte = new Date(`${dateTo}T23:59:59.999Z`)
    }
    andClauses.push({ createdAt: createdAtRange })
  }
  if (hasAttachments) {
    andClauses.push({ "attachments.0": { $exists: true } })
  }
  if (andClauses.length > 0) {
    query.$and = andClauses
  }

  const skip = (page - 1) * limit
  const [total, tasks, todoCount, inProgressCount, doneCount] = await Promise.all([
    TaskModel.countDocuments(query),
    TaskModel.find(query)
      .sort({ createdAt: sort === "created_asc" ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate("project", "title")
      .populate("assignee", "name email avatar")
      .lean(),
    TaskModel.countDocuments({ ...query, status: "TODO" }),
    TaskModel.countDocuments({ ...query, status: "IN_PROGRESS" }),
    TaskModel.countDocuments({ ...query, status: "DONE" })
  ])

  const totalPages = Math.max(1, Math.ceil(total / limit))
  const completionRate = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return NextResponse.json({
    tasks: tasks.map((task: any) => ({
      _id: task._id.toString(),
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority || "MEDIUM",
      createdAt: task.createdAt,
      dueDate: task.dueDate || null,
      project: task.project
        ? {
            _id: task.project._id.toString(),
            title: task.project.title
          }
        : null,
      assignee: task.assignee
        ? {
            _id: task.assignee._id.toString(),
            name: task.assignee.name,
            email: task.assignee.email,
            avatar: task.assignee.avatar || null
          }
        : null,
      attachmentCount: Array.isArray(task.attachments) ? task.attachments.length : 0,
      attachments: Array.isArray(task.attachments)
        ? task.attachments.map((attachment: any) => ({
            name: attachment.name || "Attachment",
            url: attachment.url || "",
            type: attachment.type || "",
            size: attachment.size || 0
          }))
        : []
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages
    },
    filters: { mine, sort, projectId },
    stats: {
      total,
      todo: todoCount,
      inProgress: inProgressCount,
      done: doneCount,
      completionRate
    }
  })
}
