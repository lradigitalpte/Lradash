# Quick Implementation Guide - Comments & Mentions

> **Priority:** 🔴 CRITICAL  
> **Timeline:** 2-3 weeks  
> **Complexity:** Medium  
> **Impact:** High (Enables team collaboration)

This guide will help you implement the comments system that's blocking team collaboration.

---

## Step 1: Create Comment Model (Day 1)

Create `src/models/comment.model.ts`:

```typescript
import mongoose, { Model } from "mongoose"

const commentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true
    },
    // For threaded replies
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null
    },
    // Users mentioned with @username
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    // Optional: track edits
    editedAt: {
      type: Date,
      default: null
    },
    edited: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

// Index for fast queries
commentSchema.index({ taskId: 1, createdAt: -1 })
commentSchema.index({ parentId: 1 })
commentSchema.index({ userId: 1 })

function getCommentModel(): Model<any> {
  if (mongoose.models.Comment) {
    return mongoose.models.Comment
  }
  return mongoose.model("Comment", commentSchema)
}

export const CommentModel = getCommentModel()
```

---

## Step 2: Create Database Layer (Day 1-2)

Create `src/lib/db/comment.ts`:

```typescript
import { connectToDatabase } from "@/lib/db/connect"
import { CommentModel } from "@/models/comment.model"

export async function createComment(
  taskId: string,
  userId: string,
  content: string,
  mentions: string[] = [],
  parentId?: string
) {
  await connectToDatabase()
  
  const comment = await CommentModel.create({
    taskId,
    userId,
    content,
    mentions,
    parentId
  })
  
  // Populate user info before returning
  await comment.populate("userId", "name email avatar")
  await comment.populate("mentions", "name email avatar")
  
  return comment.toObject()
}

export async function getTaskComments(taskId: string, parentId?: string) {
  await connectToDatabase()
  
  const query: any = { taskId }
  if (parentId) {
    query.parentId = parentId
  } else {
    query.parentId = null // Only top-level comments
  }
  
  const comments = await CommentModel.find(query)
    .populate("userId", "name email avatar")
    .populate("mentions", "name email avatar")
    .populate("parentId")
    .sort({ createdAt: -1 })
    .lean()
  
  return comments
}

export async function getCommentReplies(parentId: string) {
  await connectToDatabase()
  
  const replies = await CommentModel.find({ parentId })
    .populate("userId", "name email avatar")
    .populate("mentions", "name email avatar")
    .sort({ createdAt: 1 })
    .lean()
  
  return replies
}

export async function updateComment(
  commentId: string,
  userId: string,
  content: string
) {
  await connectToDatabase()
  
  const comment = await CommentModel.findOneAndUpdate(
    { _id: commentId, userId }, // Only owner can edit
    { 
      content,
      edited: true,
      editedAt: new Date()
    },
    { new: true }
  ).populate("userId", "name email avatar")
  
  return comment?.toObject() ?? null
}

export async function deleteComment(commentId: string, userId: string) {
  await connectToDatabase()
  
  const result = await CommentModel.deleteOne({
    _id: commentId,
    userId // Only owner can delete
  })
  
  return result.deletedCount > 0
}
```

---

## Step 3: Parse Mentions (Day 2)

Create `src/lib/mentions.ts`:

```typescript
/**
 * Parse @mentions in comment text
 * Finds @username mentions and returns list of user emails/IDs
 */

import { getUserByEmail } from "@/lib/db/user"

const MENTION_REGEX = /@(\w+)/g

export async function parseMentions(text: string, excludeUserId?: string) {
  const matches = text.matchAll(MENTION_REGEX)
  const mentionedUsers = []
  
  for (const match of matches) {
    const username = match[1]
    // In real app, you'd search by username
    // For now, we'll pass the username and handle in UI with autocomplete
  }
  
  return mentionedUsers
}

/**
 * Extract mentioned user IDs from text
 * Returns array of user IDs to add to mentions array
 */
export async function extractMentionedUserIds(
  text: string,
  userIds: string[]
): Promise<string[]> {
  // userIds come from autocomplete selection in UI
  // This function validates they exist
  
  const validIds = []
  
  for (const id of userIds) {
    const user = await getUserByEmail(id) // or by ID
    if (user) validIds.push(String(user._id))
  }
  
  return validIds
}

/**
 * Replace mention IDs with formatted text for display
 */
export function formatMentionsForDisplay(text: string, mentions: any[]) {
  let formatted = text
  
  for (const mention of mentions) {
    const regex = new RegExp(`@${mention.name}`, 'g')
    formatted = formatted.replace(
      regex,
      `<a href="/users/${mention._id}" class="text-blue-600">@${mention.name}</a>`
    )
  }
  
  return formatted
}
```

---

## Step 4: Create API Routes (Day 2-3)

Create `src/app/api/tasks/[id]/comments/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { getUserByEmail } from "@/lib/db/user"
import {
  createComment,
  getTaskComments,
  updateComment,
  deleteComment
} from "@/lib/db/comment"
import { getTaskById } from "@/lib/db/task"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params
  const parentId = request.nextUrl.searchParams.get("parentId") || undefined
  
  const comments = await getTaskComments(taskId, parentId)
  return NextResponse.json({ comments })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params
  
  // Authenticate
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const decoded = verifyAccessToken(authHeader.substring(7))
  if (!decoded?.email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  
  const user = await getUserByEmail(decoded.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  
  // Verify task exists & user can comment
  const task = await getTaskById(taskId)
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 })
  }
  
  const body = await request.json()
  const { content, mentions = [], parentId } = body
  
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 })
  }
  
  try {
    const comment = await createComment(
      taskId,
      String(user._id),
      content,
      mentions,
      parentId
    )
    
    // TODO: Dispatch notifications to mentioned users
    // dispatchNotification({
    //   for each mentioned userId:
    //     type: 'mention',
    //     recipientUserId: mentionedUserId,
    //     taskId: taskId,
    //     body: `${user.name} mentioned you in a comment`
    // })
    
    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Comment creation error:", error)
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    )
  }
}
```

Create `src/app/api/comments/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { getUserByEmail } from "@/lib/db/user"
import { updateComment, deleteComment } from "@/lib/db/comment"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params
  
  // Authenticate
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const decoded = verifyAccessToken(authHeader.substring(7))
  if (!decoded?.email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  
  const user = await getUserByEmail(decoded.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  
  const body = await request.json()
  const { content } = body
  
  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 })
  }
  
  const updated = await updateComment(commentId, String(user._id), content)
  
  if (!updated) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
  }
  
  return NextResponse.json(updated)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: commentId } = await params
  
  // Authenticate
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const decoded = verifyAccessToken(authHeader.substring(7))
  if (!decoded?.email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  
  const user = await getUserByEmail(decoded.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  
  const success = await deleteComment(commentId, String(user._id))
  
  if (!success) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 })
  }
  
  return NextResponse.json({ success: true })
}
```

---

## Step 5: Create React Hook (Day 3)

Create `src/hooks/useComments.ts`:

```typescript
"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/hooks/useAuth"

export function useComments(taskId: string) {
  const { accessToken: token } = useAuth()
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchComments = useCallback(async () => {
    if (!token || !taskId) return
    
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch comments")
      const { comments } = await res.json()
      setComments(comments)
    } catch (err) {
      console.error("Fetch comments error:", err)
    } finally {
      setLoading(false)
    }
  }, [token, taskId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const addComment = useCallback(
    async (content: string, mentions: string[] = [], parentId?: string) => {
      if (!token) return null
      
      try {
        const res = await fetch(`/api/tasks/${taskId}/comments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content, mentions, parentId })
        })
        
        if (!res.ok) throw new Error("Failed to create comment")
        const comment = await res.json()
        
        setComments([comment, ...comments])
        return comment
      } catch (err) {
        console.error("Add comment error:", err)
        return null
      }
    },
    [token, taskId]
  )

  const editComment = useCallback(
    async (commentId: string, content: string) => {
      if (!token) return null
      
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content })
        })
        
        if (!res.ok) throw new Error("Failed to update comment")
        const updated = await res.json()
        
        setComments(comments.map(c => c._id === commentId ? updated : c))
        return updated
      } catch (err) {
        console.error("Edit comment error:", err)
        return null
      }
    },
    [token, comments]
  )

  const deleteCommentById = useCallback(
    async (commentId: string) => {
      if (!token) return false
      
      try {
        const res = await fetch(`/api/comments/${commentId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!res.ok) throw new Error("Failed to delete comment")
        
        setComments(comments.filter(c => c._id !== commentId))
        return true
      } catch (err) {
        console.error("Delete comment error:", err)
        return false
      }
    },
    [token, comments]
  )

  return {
    comments,
    loading,
    addComment,
    editComment,
    deleteComment: deleteCommentById,
    refetch: fetchComments
  }
}
```

---

## Step 6: Create UI Component (Day 3-4)

Create `src/components/tasks/CommentSection.tsx`:

```typescript
"use client"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useComments } from "@/hooks/useComments"
import { formatDistanceToNow } from "date-fns"
import { Trash2, Edit2, Check, X } from "lucide-react"

interface CommentSectionProps {
  taskId: string
}

export function CommentSection({ taskId }: CommentSectionProps) {
  const { comments, loading, addComment, editComment, deleteComment } =
    useComments(taskId)
  const [newComment, setNewComment] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    const success = await addComment(newComment)
    if (success) {
      setNewComment("")
      textareaRef.current?.focus()
    }
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return
    await editComment(commentId, editText)
    setEditingId(null)
  }

  return (
    <div className="space-y-6 border-t pt-6">
      <div>
        <h3 className="text-sm font-semibold mb-4">Comments</h3>

        {/* Comment Input */}
        <div className="space-y-3 mb-6">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... (type @username to mention)"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-24"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Comment
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="text-sm text-slate-500">Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-sm text-slate-500">No comments yet</div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment._id}
                className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
              >
                {/* User Avatar */}
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={comment.userId?.avatar} />
                  <AvatarFallback>
                    {comment.userId?.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Comment Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold">
                      {comment.userId?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true
                      })}
                    </p>
                  </div>

                  {editingId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="min-h-16"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(comment._id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        {comment.content}
                      </p>
                      {comment.edited && (
                        <p className="text-xs text-slate-500 mt-1">
                          (edited)
                        </p>
                      )}
                    </>
                  )}

                  {/* Actions */}
                  {editingId !== comment._id && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingId(comment._id)
                          setEditText(comment.content)
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        <Edit2 className="h-3.5 w-3.5 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComment(comment._id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        <Trash2 className="h-3.5 w-3.5 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Step 7: Integrate into Task Modal (Day 4)

Update `src/components/tasks/TaskDetailModal.tsx`:

```typescript
import { CommentSection } from "@/components/tasks/CommentSection"

export function TaskDetailModal({ taskId }) {
  return (
    <div className="space-y-6">
      {/* Existing task details... */}
      
      {/* Add this at the bottom */}
      <CommentSection taskId={taskId} />
    </div>
  )
}
```

---

## Step 8: Add Notification on Mention (Day 4)

Update `src/lib/notifications/dispatcher.ts` to handle mentions:

```typescript
// In dispatchNotification, after comment creation:
if (comment.mentions && comment.mentions.length > 0) {
  for (const mentionedUserId of comment.mentions) {
    if (mentionedUserId !== comment.userId) { // don't notify self
      await dispatchNotification({
        recipientUserId: mentionedUserId,
        type: 'mention',
        title: `You were mentioned in a comment`,
        body: `${comment.userId.name} mentioned you: "${content.slice(0, 50)}..."`,
        taskId,
        triggeredBy: {
          userId: comment.userId._id,
          name: comment.userId.name
        }
      })
    }
  }
}
```

---

## Testing Checklist

- [ ] Create comment on task → appears instantly
- [ ] Edit comment → shows "(edited)" label
- [ ] Delete comment → removed from list
- [ ] Multiple users add comments → all visible
- [ ] Refresh page → comments persist
- [ ] API returns 401 if unauthorized
- [ ] Missing content returns 400 error
- [ ] Timestamps format correctly

---

## Timeline & Resources

| Phase | Days | Tasks |
|-------|------|-------|
| Day 1 | 1 | Model + DB layer |
| Day 2-3 | 2 | API routes + Hook |
| Day 3-4 | 1.5 | UI Components |
| Day 4 | 0.5 | Integration |
| Day 5+ | - | Testing & mentions |

**Total Effort:** 5-7 developer days

---

**Next:** After comments, implement [Team Invitations](TASK_MANAGEMENT_COMPLETION_STATUS.md#Team-Invitations)
