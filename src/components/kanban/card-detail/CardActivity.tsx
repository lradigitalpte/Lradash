"use client"

import { MessageSquare, Send, History } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { formatDate } from "@/lib/utils"

interface ActivityItem {
  id: string
  author: { name: string; avatar?: string }
  text: string
  createdAt: string
  type: "comment" | "activity"
}

interface CardActivityProps {
  cardId: string
}

export function CardActivity({ cardId }: CardActivityProps) {
  const [comment, setComment] = useState("")
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
            type: a.type
          }))
          .reverse()
        setActivities(mappedActivities)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
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
    if (comment.trim()) {
      try {
        setLoading(true)
        const userData = localStorage.getItem("user")
        const user = userData ? JSON.parse(userData) : null

        if (!user) {
          toast.error("Please log in to add comments")
          return
        }

        const taskRes = await apiClient.get(`/api/tasks/${cardId}`)
        if (!taskRes.ok) {
          throw new Error("Failed to fetch task")
        }
        const task = await taskRes.json()

        const newActivity = {
          user: user.id || user._id,
          type: "comment",
          text: comment,
          createdAt: new Date()
        }

        const updatedActivities = [...(task.activities || []), newActivity]

        const response = await apiClient.patch(`/api/tasks/${cardId}`, {
          activities: updatedActivities
        })

        if (response.ok) {
          toast.success("Comment synchronized")
          setComment("")
          fetchActivities()
        } else {
          throw new Error("Sync failure")
        }
      } catch (error) {
        toast.error("Failed to post update")
      } finally {
        setLoading(false)
      }
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
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder="Share an update or feedback..."
              value={comment}
              onChange={(e) =>{  setComment(e.target.value); }}
              rows={2}
              className="resize-none rounded-2xl border-slate-200 bg-white p-4 text-sm font-medium transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleAddComment}
                size="sm"
                disabled={!comment.trim() || loading}
                className="h-10 rounded-xl bg-slate-900 px-6 text-[10px] font-bold tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
              >
                <Send className="mr-2 h-3.5 w-3.5 stroke-[2.5]" />
                {loading ? "Syncing..." : "Post Update"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-8 px-2">
        {activities.length > 0 ? (
          activities.map((c) => (
            <div key={c.id} className="group relative flex gap-5">
              {/* Connecting Line */}
              <div className="absolute top-10 bottom-[-2rem] left-5 w-0.5 bg-slate-100 group-last:hidden dark:bg-slate-800" />

              <Avatar className="relative z-10 h-10 w-10 flex-shrink-0 border-2 border-white shadow-sm dark:border-slate-900">
                <AvatarImage src={c.author.avatar} />
                <AvatarFallback className="bg-slate-100 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {c.author.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {c.author.name}
                  </span>
                  <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">
                    {c.createdAt}
                  </span>
                </div>
                <div className="rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 group-hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
                  <p className="text-sm leading-relaxed font-medium text-slate-600 tabular-nums dark:text-slate-300">
                    {c.text}
                  </p>
                </div>
              </div>
            </div>
          ))
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
