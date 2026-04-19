"use client"

import { useState, useEffect } from "react"

import { fetchTasksCached } from "@/lib/api/tasksCache"
import { ActivityItem, Task } from "@/types/dbInterface"

type ActivityType = "created" | "updated" | "completed" | "assigned" | "commented"

export interface Activity {
  id: string
  type: ActivityType
  user: { name: string; image?: string }
  target: string
  description?: string
  timestamp: Date | string
  context?: {
    project?: string
    board?: string
  }
}

export function useRecentActivity(limit: number = 10): Activity[] {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const tasks = await fetchTasksCached()
        const activitiesFromTasks = tasks.flatMap((task) =>
          (task.activities || []).map((activity: ActivityItem) => ({
            id:
              activity._id ||
              `${task._id}-${activity.type}-${new Date(activity.createdAt).getTime()}`,
            type: activity.type === "comment" ? "commented" : inferActivityType(activity.text),
            user: {
              name: activity.user?.name || "System",
              image: activity.user?.image || activity.user?.avatar
            },
            target: task.title,
            description: activity.text,
            timestamp: activity.createdAt
          }))
        )

        const sorted = activitiesFromTasks
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit)

        setActivities(sorted)
      } catch (error) {
        console.error("Failed to fetch activities:", error)
      }
    }

    fetchActivities()
  }, [limit])

  return activities
}

function inferActivityType(text?: string): ActivityType {
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
