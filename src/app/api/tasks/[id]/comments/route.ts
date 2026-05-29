import { Types } from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getUserByEmail, getUserById } from "@/lib/db/user"
import { getNewMentionTargets, normalizeMentionTargets } from "@/lib/notifications/mentions"
import { sendMentionNotifications } from "@/lib/notifications/notification-service"
import { TaskModel } from "@/models/task.model"

/**
 * GET /api/tasks/[id]/comments
 * Get all comments for a task
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const { id: taskId } = await params

    const task = await TaskModel.findById(taskId).populate("activities.user", "name email avatar")

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Filter only comments (not activities)
    const comments = (task.activities || []).filter((a: any) => a.type === "comment")

    return NextResponse.json({ comments })
  } catch (error: any) {
    console.error("Error fetching comments:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch comments" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tasks/[id]/comments
 * Add a comment with mentions
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

    await connectToDatabase()
    const { id: taskId } = await params
    const body = await request.json()
    const { text, mentions = [] } = body
    const normalizedMentions = normalizeMentionTargets(mentions)

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
    }

    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const task = await TaskModel.findById(taskId)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Create the comment object
    const newComment = {
      _id: new Types.ObjectId(),
      user: user._id,
      type: "comment",
      text: text.trim(),
      createdAt: new Date(),
      mentions: normalizedMentions.map((mention) => ({
        userId: mention.userId,
        userName: mention.userName
      })),
      notificationsSent: normalizedMentions.map((mention) => ({
        userId: mention.userId,
        sentAt: new Date(),
        method: "in-app",
        status: "pending"
      }))
    }

    // Add comment to activities
    if (!task.activities) {
      task.activities = []
    }
    ;(task.activities as any).push(newComment)

    await task.save()

    // Populate the comment before returning
    const savedTask = await TaskModel.findById(taskId).populate(
      "activities.user",
      "name email avatar"
    )

    const savedComment = savedTask?.activities?.find(
      (a: any) => a._id?.toString() === newComment._id.toString()
    )

    console.log("✅ Comment created:", {
      taskId,
      commentId: newComment._id,
      author: user.name,
      mentions: normalizedMentions.length,
      mentionedUsers: normalizedMentions.map((mention) => mention.userName)
    })

    // Send notifications to mentioned users
    if (normalizedMentions.length > 0) {
      try {
        for (const mention of normalizedMentions) {
          await sendMentionNotifications({
            userId: mention.userId,
            type: "mention",
            taskId,
            commentId: newComment._id.toString(),
            mentionedByUser: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              avatar: user.avatar
            },
            taskTitle: task.title,
            commentText: text.trim(),
            methods: ["in-app", "email"]
          })
        }
      } catch (error) {
        console.error("Error sending notifications:", error)
        // Don't fail the comment creation if notifications fail
      }
    }

    return NextResponse.json({
      comment: savedComment,
      notificationsToSend: normalizedMentions.map((mention) => ({
        userId: mention.userId,
        type: "mention",
        taskId,
        commentId: newComment._id,
        userName: mention.userName
      }))
    })
  } catch (error: any) {
    console.error("Error creating comment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create comment" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tasks/[id]/comments/[commentId]
 * Edit a comment
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    await connectToDatabase()
    const { id: taskId } = await params
    const body = await request.json()
    const { commentId, text, mentions = [] } = body
    const normalizedMentions = normalizeMentionTargets(mentions)

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
    }

    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const task = await TaskModel.findById(taskId)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const commentIndex = (task.activities || []).findIndex(
      (a: any) => a._id?.toString() === commentId && a.user.toString() === user._id.toString()
    )

    if (commentIndex === -1 || commentIndex === undefined) {
      return NextResponse.json(
        { error: "Comment not found or you don't have permission to edit it" },
        { status: 404 }
      )
    }

    // Update comment
    if (task.activities && task.activities[commentIndex]) {
      const comment = task.activities[commentIndex] as any
      const previousMentions = normalizeMentionTargets(comment.mentions || [])
      const newlyAddedMentions = getNewMentionTargets(previousMentions, normalizedMentions)

      comment.text = text.trim()
      comment.mentions = normalizedMentions.map((mention) => ({
        userId: mention.userId,
        userName: mention.userName
      }))

      comment.notificationsSent = [
        ...(Array.isArray(comment.notificationsSent) ? comment.notificationsSent : []),
        ...newlyAddedMentions.map((mention) => ({
          userId: mention.userId,
          sentAt: new Date(),
          method: "in-app",
          status: "pending"
        }))
      ]

      if (newlyAddedMentions.length > 0) {
        try {
          for (const mention of newlyAddedMentions) {
            await sendMentionNotifications({
              userId: mention.userId,
              type: "mention",
              taskId,
              commentId,
              mentionedByUser: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar
              },
              taskTitle: task.title,
              commentText: text.trim(),
              methods: ["in-app", "email"]
            })
          }
        } catch (error) {
          console.error("Error sending notifications:", error)
        }
      }
    }

    await task.save()

    const savedTask = await TaskModel.findById(taskId).populate(
      "activities.user",
      "name email avatar"
    )

    const updatedComment = savedTask?.activities?.find((a: any) => a._id?.toString() === commentId)

    console.log("✏️ Comment updated:", {
      taskId,
      commentId,
      author: user.name,
      mentions: normalizedMentions.length
    })

    return NextResponse.json({ comment: updatedComment })
  } catch (error: any) {
    console.error("Error updating comment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update comment" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/tasks/[id]/comments/[commentId]
 * Delete a comment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    await connectToDatabase()
    const { id: taskId } = await params
    const body = await request.json()
    const { commentId } = body

    const user = decoded.userId
      ? await getUserById(decoded.userId)
      : decoded.email
        ? await getUserByEmail(decoded.email)
        : null
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const task = await TaskModel.findById(taskId)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const commentIndex = (task.activities || []).findIndex(
      (a: any) => a._id?.toString() === commentId && a.user.toString() === user._id.toString()
    )

    if (commentIndex === -1 || commentIndex === undefined) {
      return NextResponse.json(
        { error: "Comment not found or you don't have permission to delete it" },
        { status: 404 }
      )
    }

    if (task.activities) {
      task.activities.splice(commentIndex, 1)
    }
    await task.save()

    console.log("🗑️ Comment deleted:", {
      taskId,
      commentId,
      author: user.name
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting comment:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete comment" },
      { status: 500 }
    )
  }
}
