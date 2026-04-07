import mongoose, { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { dispatchNotification } from "@/lib/notifications/dispatcher"
import { DocumentModel } from "@/models/document.model"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

function formatFileSize(bytes?: number): string {
  if (!bytes || Number.isNaN(bytes)) {
    return "0 B"
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function deriveDocType(mime?: string): string {
  if (!mime) {
    return "File"
  }
  if (mime.startsWith("image/")) {
    return "Image"
  }
  if (mime.startsWith("video/")) {
    return "Video"
  }
  if (mime.includes("pdf")) {
    return "PDF"
  }
  return "File"
}

interface RawAttachment {
  name?: unknown
  url?: unknown
  type?: unknown
  size?: unknown
}

/**
 * GET /api/tasks/[id]/completion
 * Returns all completion submissions for a task (newest first)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()
    const { id: taskId } = await params

    // Native MongoDB read to bypass any schema caching / path filtering.
    const db = mongoose.connection.db
    if (!db) {
      throw new Error("Database not connected")
    }

    const doc = await db
      .collection("tasks")
      .findOne(
        { _id: new Types.ObjectId(taskId) },
        { projection: { completionSubmissions: 1, status: 1 } }
      )

    if (!doc) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const submissions = (doc as any).completionSubmissions || [] || []
    // Newest first
    submissions.sort(
      (a: any, b: any) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )

    for (const submission of submissions) {
      const reviewHistory = Array.isArray(submission?.reviewHistory) ? submission.reviewHistory : []
      reviewHistory.sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      submission.reviewHistory = reviewHistory
    }

    return NextResponse.json({ submissions, taskStatus: (doc as any).status })
  } catch (error: any) {
    console.error("GET completion error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

/**
 * POST /api/tasks/[id]/completion
 * Submit completion evidence. Any authenticated org member may call this.
 * Body: { evidenceNote?: string, evidenceAttachments?: Array<{ name, url, type, size }> }
 *
 * Uses the native MongoDB driver directly to bypass Mongoose strict-mode schema caching.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId).lean()

    if (!user || (user as any).deletedAt) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const { id: taskId } = await params
    const body = await request.json()
    const evidenceNote = typeof body?.evidenceNote === "string" ? body.evidenceNote.trim() : ""
    const rawEvidenceAttachments: RawAttachment[] = Array.isArray(body?.evidenceAttachments)
      ? (body.evidenceAttachments as RawAttachment[])
      : []
    const evidenceAttachments = rawEvidenceAttachments
      .filter((att: RawAttachment) => typeof att.url === "string" && typeof att.name === "string")
      .map((att: RawAttachment) => ({
        name: String(att.name),
        url: String(att.url),
        type: typeof att.type === "string" ? att.type : "",
        size: typeof att.size === "number" ? att.size : undefined
      }))

    // Verify task exists
    const task = await TaskModel.findById(taskId)
      .populate("assignee", "name email notificationEmail avatar")
      .populate("creator", "name email notificationEmail avatar")
      .populate("project", "name title")
      .lean()
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const projectId = (task as any)?.project?._id
      ? String((task as any).project._id)
      : (task as any)?.project
        ? String((task as any).project)
        : undefined
    const projectName = (task as any)?.project?.title || (task as any)?.project?.name || undefined

    const subId = new Types.ObjectId()
    const submission = {
      _id: subId,
      submittedBy: {
        userId: (user as any)._id,
        name: (user as any).name || (user as any).email,
        email: (user as any).email,
        avatar: (user as any).avatar || ""
      },
      submittedAt: new Date(),
      evidenceNote,
      evidenceAttachments,
      status: "pending",
      reviewHistory: []
    }

    const taskAttachmentEntries = evidenceAttachments.map((att) => ({
      name: att.name,
      url: att.url,
      type: att.type,
      size: att.size,
      createdAt: new Date()
    }))

    const activityEntry = {
      _id: new Types.ObjectId(),
      user: (user as any)._id,
      type: "activity",
      text: `submitted completion evidence${evidenceNote ? `: "${evidenceNote.slice(0, 80)}${evidenceNote.length > 80 ? "…" : ""}"` : ""}`,
      createdAt: new Date()
    }

    // Use the native MongoDB collection directly — completely bypasses Mongoose
    // strict-mode schema caching that would otherwise strip unknown fields.
    const db = mongoose.connection.db
    if (!db) {
      throw new Error("Database not connected")
    }

    const pushPayload: Record<string, any> = {
      completionSubmissions: submission,
      activities: activityEntry
    }

    if (taskAttachmentEntries.length > 0) {
      pushPayload.attachments = { $each: taskAttachmentEntries }
    }

    await db.collection("tasks").updateOne(
      { _id: new Types.ObjectId(taskId) },
      {
        $push: pushPayload as any
      }
    )

    if (projectId && evidenceAttachments.length > 0) {
      await DocumentModel.create(
        evidenceAttachments.map((att) => ({
          name: att.name,
          type: deriveDocType(att.type),
          size: formatFileSize(att.size),
          folder: "Completion Timeline",
          url: att.url,
          project: projectId,
          uploader: (user as any)._id,
          organizationId: (task as any).organizationId,
          taskId,
          taskTitle: (task as any).title
        }))
      )
    }

    const recipientIds = new Set<string>()
    if ((task as any)?.assignee?._id) {
      recipientIds.add(String((task as any).assignee._id))
    }
    if ((task as any)?.creator?._id) {
      recipientIds.add(String((task as any).creator._id))
    }
    recipientIds.delete(String((user as any)._id))

    if (recipientIds.size > 0) {
      const recipientDocs = await UserModel.find({
        _id: { $in: Array.from(recipientIds) }
      })
        .select("name email notificationEmail avatar")
        .lean()

      for (const recipient of recipientDocs as any[]) {
        const recipientEmail = getNotificationEmail(recipient)
        dispatchNotification({
          recipientUserId: String(recipient._id),
          type: "task_updated",
          title: `Completion Update: ${(task as any).title}`,
          body: `${(user as any).name || (user as any).email} submitted completion evidence${evidenceAttachments.length > 0 ? ` with ${evidenceAttachments.length} attachment(s)` : ""}.`,
          taskId,
          projectId,
          triggeredBy: {
            userId: String((user as any)._id),
            name: (user as any).name || (user as any).email,
            avatar: (user as any).avatar || undefined
          },
          email: recipientEmail
            ? {
                recipientEmail,
                recipientName: recipient.name ?? recipient.email,
                taskTitle: (task as any).title,
                taskDescription: evidenceNote,
                taskStatus: (task as any).status,
                taskPriority: (task as any).priority,
                projectName
              }
            : undefined
        }).catch(() => {})
      }
    }

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error: any) {
    console.error("POST completion error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
