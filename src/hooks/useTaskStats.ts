"use client"

import { useMemo } from "react"

import { useTaskStore } from "@/lib/store"
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
  const projects = useTaskStore((state) => state.projects)

  return useMemo(() => {
    const allTasks = projects.flatMap((p) => p.tasks || [])
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const inThreeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)

    const stats: TaskStats = {
      total: allTasks.length,
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
    }

    allTasks.forEach((task) => {
      // Count by status
      if (task.status in stats.byStatus) {
        stats.byStatus[task.status as TaskStatus]++
      }

      // Check due dates
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate)
        if (dueDate < today && task.status !== "DONE") {
          stats.overdue++
        } else if (dueDate.toDateString() === today.toDateString()) {
          stats.dueToday++
        } else if (dueDate <= inThreeDays) {
          stats.dueSoon++
        }
      }

      // Count assigned to current user
      if (userId && task.assignee && typeof task.assignee === "object" && task.assignee.id === userId) {
        stats.assignedToMe++
      }
    })

    // Calculate completion rate
    stats.completionRate = calculatePercentage(stats.byStatus.DONE, stats.total)

    return stats
  }, [projects, userId])
}
