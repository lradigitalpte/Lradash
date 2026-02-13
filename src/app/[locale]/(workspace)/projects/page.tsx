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
  Zap,
  ArrowRight
} from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

import {
  AvatarGroup,
  ProgressBar,
  SegmentedProgress,
  StatusBadge,
  StatCard
} from "@/components/common"
import { CreateProjectForm } from "@/components/projects/CreateProjectForm"
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
import { apiClient } from "@/lib/api/client"
import { cn, formatDate, getDaysUntil } from "@/lib/utils"

export default function ProjectsPage() {
  const { myBoards } = useBoards()
  const projectStats = useProjectStats()
  const [viewMode, setViewMode] = useState<"grid" | "team" | "timeline">("grid")
  const [statusFilter, setStatusFilter] = useState<"all" | "on_track" | "at_risk" | "off_track">(
    "all"
  )
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
  const attentionNeeded = allProjects.filter(
    (p) => p.status === "at_risk" || p.status === "off_track"
  )

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[5%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute top-[30%] left-[20%] -z-10 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1600px] space-y-12 p-8 lg:p-12">
        {/* WOW Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <BarChart3 className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Project Dashboard
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                  System Active
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Active{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Projects
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                {allProjects.length} active projects ·{" "}
                {allProjects.reduce((sum, p) => sum + (p.taskCount || 0), 0)} total tasks tracked
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            <CreateProjectForm />
          </div>
        </div>

        {/* Overall Project Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={allProjects.length}
            subtitle="Overall project distribution"
            icon={BarChart3}
            variant="default"
          />
          <StatCard
            title="On Track"
            value={allProjects.filter((p) => p.status === "on_track").length}
            subtitle="Projects following schedule"
            icon={TrendingUp}
            variant="success"
          />
          <StatCard
            title="At Risk"
            value={allProjects.filter((p) => p.status === "at_risk").length}
            subtitle="Needs team attention"
            icon={AlertCircle}
            variant="warning"
          />
          <StatCard
            title="Off Track"
            value={allProjects.filter((p) => p.status === "off_track").length}
            subtitle="Significant delays found"
            icon={TrendingDown}
            variant="danger"
          />
        </div>

        {/* Attention Protocol Card */}
        {attentionNeeded.length > 0 && (
          <div className="group relative">
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-r from-rose-500 to-amber-500 opacity-25 blur transition duration-1000 group-hover:opacity-40" />
            <div className="relative flex items-center gap-8 overflow-hidden rounded-[2rem] border border-rose-200/50 bg-white/40 p-8 backdrop-blur-xl dark:border-rose-500/20 dark:bg-rose-950/20">
              <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-rose-500/10 blur-3xl" />
              <div className="flex h-16 w-16 shrink-0 transform items-center justify-center rounded-2xl bg-rose-600 text-white shadow-xl shadow-rose-500/30 transition-transform duration-500 group-hover:scale-110">
                <Flame className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  Attention Required
                </h4>
                <p className="font-medium text-slate-500 italic dark:text-rose-200/70">
                  {attentionNeeded.length} projects are currently off track:{" "}
                  <span className="ml-1 font-bold text-rose-600 not-italic dark:text-rose-400">
                    {attentionNeeded.map((p) => p.project.title).join(", ")}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Primary Workspace Interface */}
        <div className="space-y-8">
          <Tabs value={viewMode} onValueChange={(v) =>{  setViewMode(v as any); }} className="w-full">
            <div className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-100 pb-2 md:flex-row md:items-center dark:border-slate-800">
              <TabsList className="h-14 w-full rounded-2xl bg-slate-100/50 p-1 md:w-auto dark:bg-slate-900/50">
                <TabsTrigger
                  value="grid"
                  className="rounded-xl px-8 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-800"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Project Grid
                </TabsTrigger>
                <TabsTrigger
                  value="team"
                  className="rounded-xl px-8 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-800"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Team View
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-xl px-8 text-[10px] font-black tracking-widest uppercase data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg dark:data-[state=active]:bg-slate-800"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <div className="flex gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all hover:shadow-md dark:bg-slate-950"
                    >
                      <Filter className="h-4 w-4 text-blue-600" />
                      Status Filter:{" "}
                      <span className="text-blue-600">
                        {statusFilter === "all" ? "All Projects" : statusFilter.replace("_", " ")}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                  >
                    <DropdownMenuLabel className="p-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Filter Options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>{  setStatusFilter("all"); }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>{  setStatusFilter("on_track"); }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      On Track
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>{  setStatusFilter("at_risk"); }}
                      className="gap-3 rounded-xl py-3 font-bold text-amber-600"
                    >
                      At Risk
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>{  setStatusFilter("off_track"); }}
                      className="gap-3 rounded-xl py-3 font-bold text-rose-600"
                    >
                      Off Track
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <TabsContent value="grid" className="m-0 focus-visible:outline-none">
              {filteredProjects.length === 0 ? (
                <div className="space-y-6 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50 py-40 text-center dark:border-slate-800 dark:bg-slate-900/10">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[3rem] bg-white text-slate-200 shadow-sm dark:bg-slate-800">
                    <Zap className="h-12 w-12" />
                  </div>
                  <div>
                    <h4 className="mb-2 text-2xl font-black text-slate-900 italic dark:text-white">
                      No Projects Found
                    </h4>
                    <p className="text-lg font-medium text-slate-500 italic opacity-60">
                      No projects match the selected filters.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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

            <TabsContent value="team" className="m-0 focus-visible:outline-none">
              <TeamWorkloadView projects={filteredProjects} />
            </TabsContent>

            <TabsContent value="timeline" className="m-0 focus-visible:outline-none">
              <TimelineView projects={filteredProjects} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Project Card Component Redesign
interface ProjectCardProps {
  project: any
  progress: number
  taskCount: number
  status: string
}

function ProjectCard({ project, progress, taskCount, status }: ProjectCardProps) {
  const router = useRouter()

  const statusConfig = {
    on_track: { label: "On Track", color: "bg-emerald-500", text: "text-emerald-600" },
    at_risk: { label: "At Risk", color: "bg-amber-500", text: "text-amber-600" },
    off_track: { label: "Off Track", color: "bg-rose-500", text: "text-rose-600" },
    completed: { label: "Completed", color: "bg-blue-500", text: "text-blue-600" }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.on_track

  // Task distribution (mock)
  const tasksInProgress = Math.floor(taskCount * 0.4)
  const tasksTodo = Math.floor(taskCount * 0.3)
  const tasksDone = Math.floor(taskCount * 0.3)

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() =>{  router.push(`/projects/${project._id}`); }}
    >
      <Card className="relative overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 transition-all duration-500 group-hover:shadow-blue-500/10 hover:-translate-y-2 dark:bg-slate-900 dark:shadow-none dark:group-hover:bg-slate-800/80">
        <div className="pointer-events-none absolute top-0 right-0 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl transition-colors group-hover:bg-blue-500/10" />

        <CardHeader className="p-10 pb-4">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white shadow-xl shadow-slate-900/20 transition-transform duration-500 group-hover:scale-110 dark:bg-white dark:text-slate-900 dark:shadow-white/10">
              {project.title.slice(0, 2).toUpperCase()}
            </div>
            <div
              className={`rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5 text-[10px] font-black tracking-widest uppercase dark:border-slate-700 dark:bg-slate-800 ${config.text}`}
            >
              {config.label}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="truncate overflow-hidden pr-8 text-2xl font-black tracking-tight whitespace-nowrap text-slate-900 uppercase transition-colors duration-300 group-hover:text-blue-600 dark:text-white">
              {project.title}
            </h3>
            <p className="line-clamp-2 min-h-[32px] text-xs leading-relaxed font-medium text-slate-400 italic">
              {project.description || "Project description not available..."}
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 p-10 pt-4">
          {/* Progress Module */}
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Project Progress
              </span>
              <span className="text-2xl font-black text-slate-900 tabular-nums dark:text-white">
                {progress}%
              </span>
            </div>
            <ProgressBar
              value={progress}
              size="sm"
              className="h-1.5 bg-slate-100 dark:bg-slate-700"
            />
          </div>

          {/* Task Stream Segmented Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Task Distribution
              </span>
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:border-blue-800 dark:bg-blue-900/30">
                {taskCount} total
              </span>
            </div>
            <SegmentedProgress
              segments={[
                { value: tasksDone, color: "bg-emerald-500 shadow-sm", label: "Done" },
                { value: tasksInProgress, color: "bg-blue-500 shadow-sm", label: "In Progress" },
                { value: tasksTodo, color: "bg-slate-300 dark:bg-slate-700", label: "To Do" }
              ]}
              total={taskCount || 1}
              size="sm"
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
            {project.members && project.members.length > 0 ? (
              <div className="flex items-center gap-3">
                <AvatarGroup
                  users={project.members.map((m: any) => ({ name: m.name }))}
                  max={3}
                  size="xs"
                />
                <span className="text-[9px] leading-none font-bold tracking-widest text-slate-400 uppercase">
                  Project Team
                </span>
              </div>
            ) : (
              <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase italic">
                No Team Members Assigned
              </span>
            )}
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="h-10 w-10 rounded-xl text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/projects/${project._id}`)
                }}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Team Workload View Redesign
interface TeamWorkloadViewProps {
  projects: any[]
}

function TeamWorkloadView({ projects }: TeamWorkloadViewProps) {
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
    return (
      <div className="space-y-4 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50 py-40 text-center dark:border-slate-800 dark:bg-slate-900/10">
        <Users className="mx-auto h-12 w-12 text-slate-200" />
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          No team members assigned yet
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from(teamMembers.values()).map((member) => (
        <Card
          key={member.name}
          className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 p-10 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 dark:bg-slate-900/60"
        >
          <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white dark:bg-white dark:text-slate-900">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                    {member.name}
                  </h3>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Project Lead
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl leading-none font-black text-blue-600 tabular-nums">
                  {member.taskCount}
                </p>
                <p className="mt-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  Total Tasks
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <span className="mb-2 block text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Assigned Projects
              </span>
              <div className="flex flex-wrap gap-2">
                {member.projects.slice(0, 3).map((proj) => (
                  <span
                    key={proj._id}
                    className="inline-flex rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-[10px] font-black tracking-widest text-blue-600 uppercase dark:border-blue-800 dark:bg-blue-900/30"
                  >
                    {proj.title}
                  </span>
                ))}
                {member.projects.length > 3 && (
                  <span className="inline-flex rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-700 dark:bg-slate-800">
                    +{member.projects.length - 3} Projects
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Current Workload
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {Math.min(Math.round((member.taskCount / 20) * 100), 100)}%
                </span>
              </div>
              <ProgressBar
                value={Math.min((member.taskCount / 20) * 100, 100)}
                size="sm"
                className="h-1.5 bg-slate-100 dark:bg-slate-800"
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// Timeline View Redesign
interface TimelineViewProps {
  projects: any[]
}

function TimelineView({ projects }: TimelineViewProps) {
  const sortedProjects = [...projects].sort((a, b) => {
    const statusOrder = { off_track: 0, at_risk: 1, on_track: 2, completed: 3 }
    return (
      statusOrder[a.status as keyof typeof statusOrder] -
      statusOrder[b.status as keyof typeof statusOrder]
    )
  })

  return (
    <div className="space-y-6">
      {sortedProjects.map(({ project, progress, status }) => {
        const daysRemaining = getDaysUntil(project.dueDate)
        const isOverdue = daysRemaining < 0
        const icon =
          status === "completed" ? CheckCircle : status === "on_track" ? Zap : AlertCircle
        const Icon = icon

        return (
          <Card
            key={project._id}
            className="group overflow-hidden rounded-[2.5rem] border-none bg-white/60 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-xl transition-all hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-800"
          >
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform group-hover:scale-110",
                  {
                    "bg-emerald-500 text-white shadow-emerald-500/20": status === "completed",
                    "bg-blue-600 text-white shadow-blue-500/20": status === "on_track",
                    "bg-amber-500 text-white shadow-amber-500/20": status === "at_risk",
                    "bg-rose-600 text-white shadow-rose-500/20": status === "off_track"
                  }
                )}
              >
                <Icon className="h-6 w-6 stroke-[3]" />
              </div>

              <div className="w-full flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xl font-black tracking-tight text-slate-900 uppercase transition-colors group-hover:text-blue-600 dark:text-white">
                      {project.title}
                    </h4>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                      Timeline Active
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-slate-900 tabular-nums dark:text-white">
                      {progress}%
                    </span>
                  </div>
                </div>
                <ProgressBar
                  value={progress}
                  size="sm"
                  variant={
                    status === "completed"
                      ? "success"
                      : status === "at_risk"
                        ? "warning"
                        : status === "off_track"
                          ? "danger"
                          : "default"
                  }
                  className="bg-slate-100 dark:bg-slate-800"
                />
              </div>

              <div className="w-full shrink-0 border-t border-slate-100 pt-4 md:w-auto md:border-t-0 md:border-l md:pt-0 md:pl-8 md:text-right dark:border-slate-800/50">
                {project.dueDate ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 md:justify-end dark:border-slate-700 dark:bg-slate-800">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span
                        className={cn(
                          "text-sm font-black tracking-tight uppercase",
                          isOverdue ? "text-rose-600" : "text-slate-900 dark:text-white"
                        )}
                      >
                        {isOverdue ? "Overdue" : `${daysRemaining} Days Left`}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Target Deadline
                    </p>
                  </div>
                ) : (
                  <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase italic">
                    No Deadline Set
                  </span>
                )}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
