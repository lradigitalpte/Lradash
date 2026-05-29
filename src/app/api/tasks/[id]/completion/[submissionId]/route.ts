import mongoose, { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
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
 * PATCH /api/tasks/[id]/completion/[submissionId]
 * Reviewer actions (ADMIN / OWNER only):
 * - approve: marks submission approved AND sets task.status = DONE
 * - review: saves reviewer note + optional attachments, keeps submission pending
 * - reject: marks submission rejected
 *
 * Body: { action: "approve" | "reject" | "review", reviewNote?: string, reviewAttachments?: Array<{name,url,type,size}> }
 *
 * Uses the native MongoDB driver directly to bypass Mongoose strict-mode caching.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; submissionId: string }> }
) {
  try {
    const guard = await requireAdmin(request)
    if ("error" in guard) {
      return guard.error
    }

    const { user } = guard

    await connectToDatabase()

    const { id: taskId, submissionId } = await params
    const body = await request.json()
    const action = body?.action
    const reviewNote = typeof body?.reviewNote === "string" ? body.reviewNote.trim() : ""
    const rawReviewAttachments: RawAttachment[] = Array.isArray(body?.reviewAttachments)
      ? (body.reviewAttachments as RawAttachment[])
      : []
    const reviewAttachments = rawReviewAttachments
      .filter((att: RawAttachment) => typeof att.url === "string" && typeof att.name === "string")
      .map((att: RawAttachment) => ({
        name: String(att.name),
        url: String(att.url),
        type: typeof att.type === "string" ? att.type : "",
        size: typeof att.size === "number" ? att.size : undefined
      }))

    if (action !== "approve" && action !== "reject" && action !== "review") {
      return NextResponse.json(
        { error: "action must be 'approve' | 'reject' | 'review'" },
        { status: 400 }
      )
    }

    const task = await TaskModel.findById(taskId)
      .populate("assignee", "name email notificationEmail avatar")
      .populate("creator", "name email notificationEmail avatar")
      .populate("project", "name title")
      .lean()

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const targetSubmission = Array.isArray((task as any).completionSubmissions)
      ? (task as any).completionSubmissions.find(
          (submission: any) => String(submission?._id) === String(submissionId)
        )
      : null

    if (!targetSubmission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const reviewedAt = new Date()
    const reviewedBy = {
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || ""
    }

    const reviewEntry = {
      reviewer: reviewedBy,
      action,
      note: reviewNote,
      attachments: reviewAttachments,
      createdAt: reviewedAt
    }

    const setFields: Record<string, any> = {
      "completionSubmissions.$.reviewedBy": reviewedBy,
      "completionSubmissions.$.reviewedAt": reviewedAt,
      "completionSubmissions.$.reviewNote": reviewNote || "",
      "completionSubmissions.$.reviewAttachments": reviewAttachments
    }

    if (action === "approve") {
      setFields["completionSubmissions.$.status"] = "approved"
      setFields["status"] = "DONE"
    } else if (action === "reject") {
      setFields["completionSubmissions.$.status"] = "rejected"
    }

    const activityEntry = {
      _id: new Types.ObjectId(),
      user: new Types.ObjectId(user._id),
      type: "activity",
      text:
        action === "approve"
          ? `approved the completion and marked this task as DONE${reviewNote ? ` — "${reviewNote}"` : ""}`
          : action === "reject"
            ? `rejected the completion submission${reviewNote ? ` — "${reviewNote}"` : ""}`
            : `reviewed the completion submission${reviewNote ? ` — "${reviewNote}"` : ""}`,
      createdAt: new Date()
    }

    const reviewAttachmentEntries = reviewAttachments.map((att) => ({
      name: att.name,
      url: att.url,
      type: att.type,
      size: att.size,
      createdAt: new Date()
    }))

    // Native MongoDB driver — bypasses Mongoose strict-mode schema caching
    const db = mongoose.connection.db
    if (!db) {
      throw new Error("Database not connected")
    }

    const result = await db.collection("tasks").updateOne(
      {
        _id: new Types.ObjectId(taskId),
        "completionSubmissions._id": new Types.ObjectId(submissionId)
      },
      {
        $set: setFields,
        $push: {
          activities: activityEntry,
          "completionSubmissions.$.reviewHistory": reviewEntry,
          ...(reviewAttachmentEntries.length > 0
            ? { attachments: { $each: reviewAttachmentEntries } }
            : {})
        } as any
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const projectId = (task as any)?.project?._id
      ? String((task as any).project._id)
      : (task as any)?.project
        ? String((task as any).project)
        : undefined
    const projectName = (task as any)?.project?.title || (task as any)?.project?.name || undefined

    if (projectId && reviewAttachments.length > 0) {
      await DocumentModel.create(
        reviewAttachments.map((att) => ({
          name: att.name,
          type: deriveDocType(att.type),
          size: formatFileSize(att.size),
          folder: "Completion Timeline",
          url: att.url,
          project: projectId,
          uploader: user._id,
          organizationId: (task as any).organizationId,
          taskId,
          taskTitle: (task as any).title
        }))
      )
    }

    const recipientIds = new Set<string>()
    if (targetSubmission?.submittedBy?.userId) {
      recipientIds.add(String(targetSubmission.submittedBy.userId))
    }
    if ((task as any)?.assignee?._id) {
      recipientIds.add(String((task as any).assignee._id))
    }
    if ((task as any)?.creator?._id) {
      recipientIds.add(String((task as any).creator._id))
    }
    recipientIds.delete(String(user._id))

    if (recipientIds.size > 0) {
      const recipientDocs = await UserModel.find({
        _id: { $in: Array.from(recipientIds) }
      })
        .select("name email notificationEmail avatar preferences.emailNotifications")
        .lean()

      const title =
        action === "approve"
          ? `Completion Approved: ${(task as any).title}`
          : action === "reject"
            ? `Completion Rejected: ${(task as any).title}`
            : `Completion Reviewed: ${(task as any).title}`
      const bodyText =
        action === "approve"
          ? `${user.name || user.email} approved a completion update and marked the task done.`
          : action === "reject"
            ? `${user.name || user.email} rejected a completion update.`
            : `${user.name || user.email} added a review update.`

      for (const recipient of recipientDocs as any[]) {
        const recipientEmail = getNotificationEmail(recipient)
        dispatchNotification({
          recipientUserId: String(recipient._id),
          type: action === "approve" ? "task_completed" : "status_change",
          title,
          body: bodyText,
          taskId,
          projectId,
          triggeredBy: {
            userId: String(user._id),
            name: user.name || user.email,
            avatar: user.avatar || undefined
          },
          email: recipientEmail
            ? {
                recipientEmail,
                recipientName: recipient.name ?? recipient.email,
                taskTitle: (task as any).title,
                taskDescription: reviewNote,
                taskStatus: action === "approve" ? "DONE" : (task as any).status,
                taskPriority: (task as any).priority,
                projectName
              }
            : undefined
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("PATCH completion error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
