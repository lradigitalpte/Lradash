"use client"

import { useMemo } from "react"

import { useTaskStore } from "@/lib/store"

type ActivityType = "created" | "updated" | "completed" | "assigned"

interface Activity {
  id: string
  type: ActivityType
  user: { name: string; image?: string }
  target: string
  description?: string
  timestamp: Date | string
}

export function useRecentActivity(limit: number = 10): Activity[] {
  const projects = useTaskStore((state) => state.projects)

  return useMemo(() => {
    const activities: Activity[] = []

    // Generate activities from tasks (in a real app, this would come from the database)
    projects.forEach((project) => {
      project.tasks?.forEach((task) => {
        // Task created activity
        if (task.creator) {
          activities.push({
            id: `${task._id}-created`,
            type: "created",
            user: {
              name: typeof task.creator === "object" ? task.creator.name : "Unknown"
            },
            target: task.title,
            timestamp: task.createdAt || new Date()
          })
        }

        // Task completed activity
        if (task.status === "DONE" && task.lastModifier) {
          activities.push({
            id: `${task._id}-completed`,
            type: "completed",
            user: {
              name: typeof task.lastModifier === "object" ? task.lastModifier.name : "Unknown"
            },
            target: task.title,
            timestamp: task.updatedAt || new Date()
          })
        }
      })
    })

    // Sort by timestamp descending and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }, [projects, limit])
}
