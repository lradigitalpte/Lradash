"use client"

import { useState, useEffect } from "react"

import { Activity } from "@/hooks/useRecentActivity"
import { apiClient } from "@/lib/api/client"

interface WorkspaceActivityResponse {
  activities: Array<{
    _id: string
    type: string
    text: string
    createdAt: string
    user: { name: string; email?: string; avatar?: string }
    task: {
      _id: string
      title: string
      project?: { _id: string; title: string }
      board?: { _id: string; title: string }
    }
  }>
}

export function useWorkspaceActivity(limit: number = 5): Activity[] {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true)
      try {
        const response = await apiClient.get("/api/activity/workspace")

        if (response.ok) {
          const data = (await response.json()) as WorkspaceActivityResponse
          const formattedActivities: Activity[] = data.activities.slice(0, limit).map((act) => ({
            id: act._id,
            type: act.type === "comment" ? "commented" : inferActivityType(act.text),
            user: {
              name: act.user?.name || "System",
              image: act.user?.avatar
            },
            target: act.task.title,
            description: act.text,
            timestamp: act.createdAt,
            context: {
              project: act.task.project?.title,
              board: act.task.board?.title
            }
          }))

          setActivities(formattedActivities)
        }
      } catch (error) {
        console.error("Failed to fetch workspace activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [limit])

  return activities
}

function inferActivityType(
  text?: string
): "created" | "updated" | "completed" | "assigned" | "commented" {
  const normalizedText = text?.toLowerCase() || ""

  if (normalizedText.includes("assign")) {
    return "assigned"
  }
  if (normalizedText.includes("complete")) {
    return "completed"
  }
  if (
    normalizedText.includes("create") ||
    normalizedText.includes("added") ||
    normalizedText.includes("new task")
  ) {
    return "created"
  }

  return "updated"
}
