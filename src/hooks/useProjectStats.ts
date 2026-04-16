"use client"

import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"
import { calculatePercentage } from "@/lib/utils"
import { Project, UserInfo } from "@/types/dbInterface"

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

interface ProjectApiResponse {
  _id?: string
  id?: string
  title: string
  description?: string
  owner: Project["owner"]
  members?: Array<
    | Project["members"][number]
    | { _id?: string; id?: string; name: string; email?: string; avatar?: string | null }
  >
  createdAt: string
  updatedAt: string
  taskStats?: {
    total?: number
    done?: number
    inProgress?: number
    todo?: number
  }
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
          const projects = (await projectsResponse.json()) as ProjectApiResponse[]

          let totalTasks = 0
          let completedTasks = 0
          let inProgressTasks = 0
          let todoTasks = 0

          const projectsWithProgress = projects.map((project) => {
            const total = project.taskStats?.total ?? 0
            const done = project.taskStats?.done ?? 0
            const inProgress = project.taskStats?.inProgress ?? 0
            const todo = project.taskStats?.todo ?? 0

            totalTasks += total
            completedTasks += done
            inProgressTasks += inProgress
            todoTasks += todo

            const normalizedProject: Project = {
              _id: project._id ?? project.id ?? "",
              title: project.title,
              description: project.description ?? "",
              organizationId: "",
              owner: project.owner,
              members: (project.members ?? []).reduce<UserInfo[]>((acc, member) => {
                const memberId =
                  "id" in member && member.id
                    ? member.id
                    : "_id" in member && member._id
                      ? member._id
                      : null
                if (!memberId) {
                  return acc
                }
                acc.push({
                  id: memberId,
                  name: member.name,
                  email: "email" in member ? member.email : undefined,
                  avatar: "avatar" in member ? (member.avatar ?? undefined) : undefined,
                  image:
                    "image" in member && member.image
                      ? member.image
                      : "avatar" in member
                        ? (member.avatar ?? undefined)
                        : undefined
                })
                return acc
              }, []),
              createdAt: project.createdAt,
              updatedAt: project.updatedAt,
              tasks: [],
              board: "",
              isArchived: false
            }

            return {
              project: normalizedProject,
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
      } catch (error) {
        console.error("Failed to fetch project stats:", error)
      }
    }

    fetchStats()
  }, [])

  return stats
}
