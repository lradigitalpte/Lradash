"use client"

import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Filter,
  Flame,
  ListTodo,
  MoreVertical,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import { AvatarGroup, ProgressBar, SegmentedProgress, StatusBadge } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBoards } from "@/hooks/useBoards"
import { useProjectStats } from "@/hooks/useProjectStats"
import { useTaskStats } from "@/hooks/useTaskStats"
import { useRouter } from "@/i18n/navigation"
import { cn, formatDate, getDaysUntil } from "@/lib/utils"
import { CreateProjectForm } from "@/components/projects/CreateProjectForm"
import { apiClient } from "@/lib/api/client"

export default function ProjectsPage() {
  const { myBoards } = useBoards()
  const projectStats = useProjectStats()
  const [viewMode, setViewMode] = useState<"grid" | "team" | "timeline">("grid")
  const [statusFilter, setStatusFilter] = useState<"all" | "on_track" | "at_risk" | "off_track">("all")
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ title: "", description: "" })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await apiClient.get("/api/projects")

      if (!response.ok) {
        throw new Error("Failed to fetch projects")
      }

      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async () => {
    if (!formData.title.trim()) {
      toast.error("Project title is required")
      return
    }

    try {
      const response = await apiClient.post("/api/projects", formData)

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to create project")
        return
      }

      toast.success("Project created successfully!")
      setFormData({ title: "", description: "" })
      setDialogOpen(false)
      fetchProjects()
    } catch (error) {
      console.error("Create project error:", error)
      toast.error("Failed to create project")
    }
  }

  if (loading) {
    return <div className="p-6">Loading projects...</div>
  }

  // Transform API projects to card format
  const allProjects = projects.map((p: any) => ({
    project: { _id: p.id, title: p.title, description: p.description, owner: p.owner },
    progress: 0,
    taskCount: 0,
    status: "on_track"
  }))

  // Filter projects
  const filteredProjects =
    statusFilter === "all" ? allProjects : allProjects.filter((p) => p.status === statusFilter)

  // Get attention-needed projects (at risk or off track)
  const attentionNeeded = allProjects.filter((p) => p.status === "at_risk" || p.status === "off_track")

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            {allProjects.length} projects · {allProjects.reduce((sum, p) => sum + (p.taskCount || 0), 0)} total tasks
          </p>
        </div>
        <CreateProjectForm />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-2xl font-bold">{allProjects.length}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-primary/50" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Track</p>
              <p className="text-2xl font-bold">{allProjects.filter((p) => p.status === "on_track").length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500/50" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">At Risk</p>
              <p className="text-2xl font-bold text-yellow-600">{allProjects.filter((p) => p.status === "at_risk").length}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-500/50" />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Off Track</p>
              <p className="text-2xl font-bold text-red-600">{allProjects.filter((p) => p.status === "off_track").length}</p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500/50" />
          </div>
        </div>
      </div>

      {/* Attention Needed Alert */}
      {attentionNeeded.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="flex items-center gap-4 pt-6">
            <Flame className="h-6 w-6 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                {attentionNeeded.length} project{attentionNeeded.length > 1 ? "s" : ""} need attention
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {attentionNeeded.map((p) => p.project.title).join(", ")}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Tabs */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full">
        <div className="flex items-center justify-between border-b">
          <TabsList className="w-auto bg-transparent p-0">
            <TabsTrigger
              value="grid"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Users className="mr-2 h-4 w-4" />
              Team View
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Projects</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("on_track")}>On Track</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("at_risk")}>At Risk</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("off_track")}>Off Track</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* GRID VIEW */}
        <TabsContent value="grid" className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No projects found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map(({ project, progress, taskCount, status }) => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  progress={progress}
                  taskCount={taskCount}
                  status={status}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TEAM VIEW */}
        <TabsContent value="team" className="space-y-4">
          <TeamWorkloadView projects={filteredProjects} />
        </TabsContent>

        {/* TIMELINE VIEW */}
        <TabsContent value="timeline" className="space-y-4">
          <TimelineView projects={filteredProjects} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Project Card Component
interface ProjectCardProps {
  project: any
  progress: number
  taskCount: number
  status: string
}

function ProjectCard({ project, progress, taskCount, status }: ProjectCardProps) {
  const router = useRouter()

  const statusConfig = {
    on_track: { label: "On Track", color: "bg-green-100 text-green-800" },
    at_risk: { label: "At Risk", color: "bg-yellow-100 text-yellow-800" },
    off_track: { label: "Off Track", color: "bg-red-100 text-red-800" },
    completed: { label: "Completed", color: "bg-blue-100 text-blue-800" }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.on_track

  // Task distribution (mock)
  const tasksInProgress = Math.floor(taskCount * 0.4)
  const tasksTodo = Math.floor(taskCount * 0.3)
  const tasksDone = Math.floor(taskCount * 0.3)

  return (
    <Card
      className="group cursor-pointer transition-all hover:border-primary hover:shadow-lg"
      onClick={() => router.push(`/projects/${project._id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="truncate text-lg group-hover:text-primary">{project.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{project.description || "No description"}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2">
          <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", config.color)}>
            {config.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <ProgressBar value={progress} size="md" />
        </div>

        {/* Task Distribution */}
        <div>
          <p className="mb-2 text-sm font-medium">Task Distribution</p>
          <SegmentedProgress
            segments={[
              { value: tasksDone, color: "bg-green-500", label: "Done" },
              { value: tasksInProgress, color: "bg-blue-500", label: "In Progress" },
              { value: tasksTodo, color: "bg-slate-300", label: "To Do" }
            ]}
            total={taskCount || 1}
            size="sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">{taskCount} total tasks</p>
        </div>

        {/* Team Members */}
        {project.members && project.members.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Team</p>
            <AvatarGroup users={project.members.map((m: any) => ({ name: m.name }))} max={4} size="sm" />
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project._id}`) }}>
            <ListTodo className="mr-1 h-3 w-3" />
            Tasks
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); router.push(`/projects/${project._id}`) }}>
            <Users className="mr-1 h-3 w-3" />
            Team
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Team Workload View
interface TeamWorkloadViewProps {
  projects: any[]
}

function TeamWorkloadView({ projects }: TeamWorkloadViewProps) {
  // Extract unique team members from all projects
  const teamMembers = new Map<string, { name: string; projects: any[]; taskCount: number }>()

  projects.forEach(({ project, taskCount }) => {
    if (project.members) {
      project.members.forEach((member: any) => {
        if (!teamMembers.has(member.name)) {
          teamMembers.set(member.name, { name: member.name, projects: [], taskCount: 0 })
        }
        const data = teamMembers.get(member.name)!
        data.projects.push(project)
        data.taskCount += taskCount
      })
    }
  })

  if (teamMembers.size === 0) {
    return <div className="py-8 text-center text-muted-foreground">No team members assigned</div>
  }

  return (
    <div className="space-y-4">
      {Array.from(teamMembers.values()).map((member) => (
        <Card key={member.name}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{member.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {member.projects.slice(0, 3).map((proj) => (
                    <span key={proj._id} className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs">
                      {proj.title}
                    </span>
                  ))}
                  {member.projects.length > 3 && (
                    <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs">
                      +{member.projects.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{member.taskCount}</p>
                <p className="text-xs text-muted-foreground">assigned tasks</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${Math.min((member.taskCount / 20) * 100, 100)}%`
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Timeline View
interface TimelineViewProps {
  projects: any[]
}

function TimelineView({ projects }: TimelineViewProps) {
  // Sort projects by status and progress
  const sortedProjects = [...projects].sort((a, b) => {
    const statusOrder = { off_track: 0, at_risk: 1, on_track: 2, completed: 3 }
    return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder]
  })

  return (
    <div className="space-y-3">
      {sortedProjects.map(({ project, progress, status }) => {
        const daysRemaining = getDaysUntil(project.dueDate)
        const isOverdue = daysRemaining < 0
        const icon = status === "completed" ? CheckCircle : status === "on_track" ? Zap : AlertCircle

        const Icon = icon

        return (
          <Card key={project._id} className="overflow-hidden">
            <CardContent className="flex items-center gap-4 p-4">
              <Icon className={cn("h-5 w-5 flex-shrink-0", {
                "text-green-500": status === "completed",
                "text-blue-500": status === "on_track",
                "text-yellow-500": status === "at_risk",
                "text-red-500": status === "off_track"
              })} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{project.title}</h4>
                  <span className="text-sm font-semibold">{progress}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full transition-all", {
                      "bg-green-500": status === "completed",
                      "bg-blue-500": status === "on_track",
                      "bg-yellow-500": status === "at_risk",
                      "bg-red-500": status === "off_track"
                    })}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                {project.dueDate && (
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={isOverdue ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                      {isOverdue ? "Overdue" : `${daysRemaining}d left`}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
