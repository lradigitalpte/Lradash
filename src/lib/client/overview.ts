import type { OrganizationAccessContext } from "@/lib/auth/organization-access"
import mongoose from "mongoose"

import { ProjectModel } from "@/models/project.model"
import { TaskModel } from "@/models/task.model"

export interface ClientOverviewData {
  viewer: {
    id: string
    name: string
    email: string
    orgRole: string
    organizationName: string
  }
  summary: {
    projectCount: number
    totalTasks: number
    doneTasks: number
    inProgressTasks: number
    overdueTasks: number
    completionRate: number
  }
  projects: Array<{
    id: string
    title: string
    description: string
    dueDate?: Date
    status: string
    priority: string
    updatedAt: Date
    taskStats: {
      total: number
      done: number
      inProgress: number
      todo: number
      overdue: number
      completionRate: number
    }
  }>
}

export async function getClientOverviewData(
  access: OrganizationAccessContext
): Promise<ClientOverviewData> {
  const orgObjectId = new mongoose.Types.ObjectId(access.org._id)
  const userObjectId = new mongoose.Types.ObjectId(access.user._id)
  const now = new Date()

  const projects = await ProjectModel.find({
    organizationId: orgObjectId,
    deletedAt: null,
    isArchived: false,
    $or: [{ owner: userObjectId }, { members: userObjectId }]
  } as any)
    .select("title description dueDate status priority createdAt updatedAt")
    .sort({ updatedAt: -1 })
    .lean()

  const projectIds = projects.map((project: any) => project._id)

  const taskStats = projectIds.length
    ? await TaskModel.aggregate([
        {
          $match: {
            organizationId: orgObjectId,
            project: { $in: projectIds },
            isArchived: false,
            $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
          }
        },
        {
          $group: {
            _id: "$project",
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ["$status", "DONE"] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
            todo: { $sum: { $cond: [{ $eq: ["$status", "TODO"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ["$dueDate", null] },
                      { $lt: ["$dueDate", now] },
                      { $ne: ["$status", "DONE"] }
                    ]
                  },
                  1,
                  0
                ]
              }
            }
          }
        }
      ])
    : []

  const statsByProject = new Map(taskStats.map((stat: any) => [stat._id.toString(), stat]))

  const summary = {
    projectCount: projects.length,
    totalTasks: 0,
    doneTasks: 0,
    inProgressTasks: 0,
    overdueTasks: 0
  }

  const normalizedProjects = projects.map((project: any) => {
    const stats = statsByProject.get(project._id.toString()) || {
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
      overdue: 0
    }

    summary.totalTasks += stats.total
    summary.doneTasks += stats.done
    summary.inProgressTasks += stats.inProgress
    summary.overdueTasks += stats.overdue

    const completionRate = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

    return {
      id: project._id.toString(),
      title: project.title,
      description: project.description || "",
      dueDate: project.dueDate,
      status: project.status,
      priority: project.priority,
      updatedAt: project.updatedAt,
      taskStats: {
        total: stats.total,
        done: stats.done,
        inProgress: stats.inProgress,
        todo: stats.todo,
        overdue: stats.overdue,
        completionRate
      }
    }
  })

  const completionRate =
    summary.totalTasks > 0 ? Math.round((summary.doneTasks / summary.totalTasks) * 100) : 0

  return {
    viewer: {
      id: access.user._id,
      name: access.user.name,
      email: access.user.email,
      orgRole: access.orgRole,
      organizationName: access.org.name
    },
    summary: {
      ...summary,
      completionRate
    },
    projects: normalizedProjects
  }
}
