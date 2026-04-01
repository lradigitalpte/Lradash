import mongoose, { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { TaskModel } from "@/models/task.model"
import { UserModel } from "@/models/user.model"

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
    const { evidenceNote, evidenceAttachments } = body

    // Verify task exists
    const task = await TaskModel.findById(taskId).lean()
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

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
      evidenceNote: evidenceNote || "",
      evidenceAttachments: evidenceAttachments || [],
      status: "pending"
    }

    const activityEntry = {
      _id: new Types.ObjectId(),
      user: (user as any)._id,
      type: "activity",
      text: `submitted completion evidence${evidenceNote ? `: "${(evidenceNote as string).slice(0, 80)}${evidenceNote.length > 80 ? "…" : ""}"` : ""}`,
      createdAt: new Date()
    }

    // Use the native MongoDB collection directly — completely bypasses Mongoose
    // strict-mode schema caching that would otherwise strip unknown fields.
    const db = mongoose.connection.db
    if (!db) {
      throw new Error("Database not connected")
    }

    await db.collection("tasks").updateOne(
      { _id: new Types.ObjectId(taskId) },
      {
        $push: {
          completionSubmissions: submission,
          activities: activityEntry
        } as any
      }
    )

    return NextResponse.json({ submission }, { status: 201 })
  } catch (error: any) {
    console.error("POST completion error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
