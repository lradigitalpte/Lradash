"use client"

import { useMemo } from "react"

import { useTaskStore } from "@/lib/store"
import { calculatePercentage } from "@/lib/utils"
import { Project } from "@/types/dbInterface"

interface ProjectStats {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  overallProgress: number
  projectsWithProgress: Array<{
    project: Project
    progress: number
    taskCount: number
  }>
}

export function useProjectStats(): ProjectStats {
  const projects = useTaskStore((state) => state.projects)

  return useMemo(() => {
    let totalTasks = 0
    let completedTasks = 0
    let inProgressTasks = 0
    let todoTasks = 0

    const projectsWithProgress = projects.map((project) => {
      const tasks = project.tasks || []
      const done = tasks.filter((t) => t.status === "DONE").length
      const total = tasks.length

      totalTasks += total
      completedTasks += done
      inProgressTasks += tasks.filter((t) => t.status === "IN_PROGRESS").length
      todoTasks += tasks.filter((t) => t.status === "TODO").length

      return {
        project,
        progress: calculatePercentage(done, total),
        taskCount: total
      }
    })

    return {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overallProgress: calculatePercentage(completedTasks, totalTasks),
      projectsWithProgress
    }
  }, [projects])
}
