"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Plus, LayoutGrid, Calendar, Users, TrendingUp, Clock, Activity, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api/client"

export default function ProjectPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const locale = params?.locale as string
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}`)
      if (!response.ok) {
        setError("Project not found")
        return
      }
      const data = await response.json()
      setProject(data)
    } catch (err) {
      setError("Failed to load project")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-xl font-medium text-muted-foreground mb-4">{error || "Project not found"}</p>
          <Link href={`/${locale}/projects`}>
            <Button className="mt-4" variant="outline">Back to Projects</Button>
          </Link>
        </div>
      </div>
    )
  }

  const projectTasks = project.tasks || []
  const totalTasks = projectTasks.length
  const todoTasks = projectTasks.filter((t: any) => t.status === "TODO").length
  const inProgressTasks = projectTasks.filter((t: any) => t.status === "IN_PROGRESS").length
  const doneTasks = projectTasks.filter((t: any) => t.status === "DONE").length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Get recent tasks (last 5 tasks sorted by updated date)
  const recentTasks = projectTasks
    .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Project Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              {project.description || "No description provided"}
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Last updated {new Date(project.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Link href={`/${locale}/projects/${projectId}/board`}>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Task
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tasks</CardTitle>
            <LayoutGrid className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All work packages
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
            <Clock className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{doneTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Done tasks
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
          <CardDescription>Overall completion status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completion</span>
              <span className="font-medium">{completionRate}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-400" />
              <span className="text-sm text-muted-foreground">{todoTasks} To Do</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="text-sm text-muted-foreground">{inProgressTasks} In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-sm text-muted-foreground">{doneTasks} Done</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Work Packages */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Work Packages</CardTitle>
            <CardDescription>Latest activity in this project</CardDescription>
          </div>
          <Link href={`/${locale}/projects/${projectId}/work-packages`}>
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <div className="text-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No work packages yet</p>
              <Link href={`/${locale}/projects/${projectId}/board`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Task
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center">
                      {task.status === "DONE" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : task.status === "IN_PROGRESS" ? (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      task.priority === "HIGH" ? "destructive" :
                      task.priority === "MEDIUM" ? "default" : "secondary"
                    }>
                      {task.priority}
                    </Badge>
                    {task.assignee && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback>{task.assignee.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`/${locale}/projects/${projectId}/board`}>
          <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-md">
            <CardHeader>
              <LayoutGrid className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Board View</CardTitle>
              <CardDescription>Manage tasks in Kanban style</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href={`/${locale}/projects/${projectId}/calendar`}>
          <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-md">
            <CardHeader>
              <Calendar className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View tasks by date</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        
        <Link href={`/${locale}/projects/${projectId}/team`}>
          <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-md">
            <CardHeader>
              <Users className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Team</CardTitle>
              <CardDescription>Manage project members</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}