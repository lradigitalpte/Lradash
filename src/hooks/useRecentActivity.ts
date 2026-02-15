"use client"

import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"

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
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // Fetch all tasks to generate activity log
        const response = await apiClient.get("/api/tasks")
        if (response.ok) {
          const tasks = await response.json()
          const activitiesFromTasks: Activity[] = []

          // Convert tasks to activities (created and completed)
          tasks.forEach((task: any) => {
            // Task created activity
            if (task.creator) {
              activitiesFromTasks.push({
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
              activitiesFromTasks.push({
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

          // Sort by timestamp descending and limit
          const sorted = activitiesFromTasks
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit)

          setActivities(sorted)
        }
      } catch (error) {
        console.error("Failed to fetch activities:", error)
      }
    }

    fetchActivities()
  }, [limit])

  return activities
}
