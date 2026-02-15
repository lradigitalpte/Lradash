"use client"

import {
  MessageSquare,
  History,
  CheckCircle,
  Edit,
  UserPlus,
  Trash2,
  Plus,
  Tag
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api/client"
import { formatDate, cn } from "@/lib/utils"

import { MentionInput } from "./MentionInput"

interface ActivityItem {
  id: string
  author: { name: string; avatar?: string }
  text: string
  createdAt: string
  type: "comment" | "activity"
  mentions?: Array<{ userId: string; userName: string }>
}

interface MentionedUser {
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
}

// Helper function to get icon and color for activity type
function getActivityIcon(text: string) {
  if (text.includes("Status changed")) {
    return { icon: Edit, color: "text-blue-500", bgColor: "bg-blue-50 dark:bg-blue-900/30" }
  }
  if (text.includes("Assigned to")) {
    return { icon: UserPlus, color: "text-green-500", bgColor: "bg-green-50 dark:bg-green-900/30" }
  }
  if (text.includes("deleted")) {
    return { icon: Trash2, color: "text-red-500", bgColor: "bg-red-50 dark:bg-red-900/30" }
  }
  if (text.includes("created")) {
    return { icon: Plus, color: "text-indigo-500", bgColor: "bg-indigo-50 dark:bg-indigo-900/30" }
  }
  return { icon: CheckCircle, color: "text-slate-400", bgColor: "bg-slate-50 dark:bg-slate-900/30" }
}

interface CardActivityProps {
  cardId: string
}

export function CardActivity({ cardId }: CardActivityProps) {
  const [comment, setComment] = useState("")
  const [mentions, setMentions] = useState<MentionedUser[]>([])
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/tasks/${cardId}`)
      if (response.ok) {
        const data = await response.json()
        const mappedActivities: ActivityItem[] = (data.activities || [])
          .map((a: any) => ({
            id: a._id,
            author: { name: a.user.name, avatar: a.user.avatar },
            text: a.text,
            createdAt:
              typeof a.createdAt === "string"
                ? a.createdAt
                : new Date(a.createdAt).toLocaleString(),
            type: a.type,
            mentions: a.mentions || []
          }))
          .reverse()
        setActivities(mappedActivities)
      }
    } catch (error) {
      // Silently handle fetch errors
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (cardId) {
      fetchActivities()
    }
  }, [cardId])

  const handleAddComment = async () => {
    if (!comment.trim()) {
      toast.error("Please enter a comment")
      return
    }

    try {
      setLoading(true)
      const userData = localStorage.getItem("user")
      const user = userData ? JSON.parse(userData) : null

      if (!user) {
        toast.error("Please log in to add comments")
        return
      }

      // Send comment with mentions
      const response = await apiClient.post(`/api/tasks/${cardId}/comments`, {
        text: comment,
        mentions: mentions
      })

      if (response.ok) {
        const data = await response.json()

        // Handle notifications if needed
        if (data.notificationsToSend && data.notificationsToSend.length > 0) {
          // Future: Send email/push notifications here
        }

        toast.success(
          mentions.length > 0
            ? `Comment posted with ${mentions.length} mention${mentions.length > 1 ? "s" : ""}`
            : "Comment posted"
        )
        setComment("")
        setMentions([])
        fetchActivities()
      } else {
        toast.error("Failed to post comment")
      }
    } catch (error) {
      toast.error("Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
          <MessageSquare className="h-4 w-4 stroke-[2.5] text-slate-500 dark:text-slate-400" />
        </div>
        <h3 className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Activity & Audit
        </h3>
      </div>

      {/* Add Comment */}
      <div className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-6 shadow-sm dark:border-slate-800/50 dark:bg-slate-800/30">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white shadow-md dark:border-slate-900">
            <AvatarFallback className="bg-indigo-50 text-[10px] font-black text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              CU
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <MentionInput
              value={comment}
              onChange={setComment}
              mentions={mentions}
              onMentionsChange={setMentions}
              onSubmit={handleAddComment}
              isLoading={loading}
              placeholder="Share an update or feedback... Type @ to mention users"
            />
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-8 px-2">
        {activities.length > 0 ? (
          activities.map((c) => {
            const isComment = c.type === "comment"
            const activityIcon = getActivityIcon(c.text)
            const ActivityIcon = activityIcon.icon

            return (
              <div key={c.id} className="group relative flex gap-5">
                {/* Connecting Line */}
                <div className="absolute top-10 bottom-[-2rem] left-5 w-0.5 bg-slate-100 group-last:hidden dark:bg-slate-800" />

                {isComment ? (
                  <Avatar className="relative z-10 h-10 w-10 flex-shrink-0 border-2 border-white shadow-sm dark:border-slate-900">
                    <AvatarImage src={c.author.avatar} />
                    <AvatarFallback className="bg-slate-100 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {c.author.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div
                    className={cn(
                      "relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm dark:border-slate-900",
                      activityIcon.bgColor
                    )}
                  >
                    <ActivityIcon className={cn("h-5 w-5 stroke-[2.5]", activityIcon.color)} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {c.author.name}
                    </span>
                    <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      {c.createdAt}
                    </span>
                    {!isComment && (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black tracking-widest text-slate-400 uppercase dark:bg-slate-800">
                        System
                      </span>
                    )}
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl rounded-tl-none border p-4 shadow-sm transition-all duration-300 group-hover:shadow-md",
                      isComment
                        ? "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900/50"
                        : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm leading-relaxed font-medium tabular-nums",
                        isComment
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-600 italic dark:text-slate-300"
                      )}
                    >
                      {c.text}
                    </p>

                    {/* Show mentions if present */}
                    {isComment && c.mentions && c.mentions.length > 0 && (
                      <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                        <div className="text-xs font-black tracking-widest text-slate-400 uppercase">
                          👤 Tagged Users
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {c.mentions.map((mention, idx) => (
                            <div
                              key={idx}
                              className="group relative flex items-center gap-2 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-3 py-2 text-xs font-bold text-purple-700 shadow-sm transition-all duration-200 hover:from-purple-500/20 hover:to-pink-500/20 hover:shadow-md dark:border-purple-700/40 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-300 dark:hover:from-purple-900/50 dark:hover:to-pink-900/50"
                            >
                              {/* Highlight badge */}
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-[10px] font-black text-white">
                                @
                              </div>

                              {/* User name */}
                              <span className="truncate">{mention.userName}</span>

                              {/* Pulse indicator */}
                              <div className="absolute top-2 right-2 h-1.5 w-1.5 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/20 py-12 text-center dark:border-slate-800 dark:bg-slate-900/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <History className="h-6 w-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-500 uppercase">
                No Activity Logged
              </p>
              <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase italic">
                Audit stream is currently clean
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
