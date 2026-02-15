"use client"

import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"
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
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    todoTasks: 0,
    overallProgress: 0,
    projectsWithProgress: []
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all projects
        const projectsResponse = await apiClient.get("/api/projects")
        if (projectsResponse.ok) {
          const projects = await projectsResponse.json()

          // Fetch all tasks
          const tasksResponse = await apiClient.get("/api/tasks")
          if (tasksResponse.ok) {
            const allTasks = await tasksResponse.json()

            let totalTasks = 0
            let completedTasks = 0
            let inProgressTasks = 0
            let todoTasks = 0

            const projectsWithProgress = projects.map((project: Project) => {
              const tasks = allTasks.filter((task: any) => task.projectId === project._id)
              const done = tasks.filter((t: any) => t.status === "DONE").length
              const total = tasks.length

              totalTasks += total
              completedTasks += done
              inProgressTasks += tasks.filter((t: any) => t.status === "IN_PROGRESS").length
              todoTasks += tasks.filter((t: any) => t.status === "TODO").length

              return {
                project,
                progress: calculatePercentage(done, total),
                taskCount: total
              }
            })

            setStats({
              totalProjects: projects.length,
              totalTasks,
              completedTasks,
              inProgressTasks,
              todoTasks,
              overallProgress: calculatePercentage(completedTasks, totalTasks),
              projectsWithProgress
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch project stats:", error)
      }
    }

    fetchStats()
  }, [])

  return stats
}
