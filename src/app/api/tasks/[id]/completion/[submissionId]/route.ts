import mongoose, { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"
import { TaskModel } from "@/models/task.model"

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
    const { action, reviewNote, reviewAttachments } = body

    if (action !== "approve" && action !== "reject" && action !== "review") {
      return NextResponse.json(
        { error: "action must be 'approve' | 'reject' | 'review'" },
        { status: 400 }
      )
    }

    const reviewedAt = new Date()
    const reviewedBy = {
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || ""
    }

    const setFields: Record<string, any> = {
      "completionSubmissions.$.reviewedBy": reviewedBy,
      "completionSubmissions.$.reviewedAt": reviewedAt,
      "completionSubmissions.$.reviewNote": reviewNote || ""
    }
    if (Array.isArray(reviewAttachments)) {
      setFields["completionSubmissions.$.reviewAttachments"] = reviewAttachments
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
        $push: { activities: activityEntry } as any
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("PATCH completion error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
