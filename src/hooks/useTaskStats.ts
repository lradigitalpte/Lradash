"use client"

import { useState, useEffect } from "react"

import { fetchTasksCached } from "@/lib/api/tasksCache"
import { calculatePercentage, TaskStatus } from "@/lib/utils"

interface TaskStats {
  total: number
  byStatus: Record<TaskStatus, number>
  overdue: number
  dueToday: number
  dueSoon: number
  completionRate: number
  assignedToMe: number
}

export function useTaskStats(userId?: string | null): TaskStats {
  const [stats, setStats] = useState<TaskStats>({
    total: 0,
    byStatus: {
      TODO: 0,
      IN_PROGRESS: 0,
      DONE: 0
    },
    overdue: 0,
    dueToday: 0,
    dueSoon: 0,
    completionRate: 0,
    assignedToMe: 0
  })

  useEffect(() => {
    // Wait until we have a userId before fetching
    if (!userId) {
      return
    }

    const fetchStats = async () => {
      try {
        const allTasks = await fetchTasksCached()
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const inThreeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

        const newStats: TaskStats = {
          total: allTasks.length,
          byStatus: { TODO: 0, IN_PROGRESS: 0, DONE: 0 },
          overdue: 0,
          dueToday: 0,
          dueSoon: 0,
          completionRate: 0,
          assignedToMe: 0
        }

        allTasks.forEach((task: any) => {
          if (task.status in newStats.byStatus) {
            newStats.byStatus[task.status as TaskStatus]++
          }

          if (task.dueDate) {
            const dueDate = new Date(task.dueDate)
            if (dueDate < today && task.status !== "DONE") {
              newStats.overdue++
            } else if (dueDate.toDateString() === today.toDateString()) {
              newStats.dueToday++
            } else if (dueDate <= inThreeDays) {
              newStats.dueSoon++
            }
          }

          if (task.assignee && typeof task.assignee === "object" && task.assignee.id === userId) {
            newStats.assignedToMe++
          }
        })

        newStats.completionRate = calculatePercentage(newStats.byStatus.DONE, newStats.total)
        setStats(newStats)
      } catch (error) {
        console.error("Failed to fetch task stats:", error)
      }
    }

    fetchStats()
  }, [userId])

  return stats
}
