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
import { fetchProjectsCached, invalidateProjectsCache } from "@/lib/api/projectsCache"
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
      const data = await fetchProjectsCached()
      setProjects(data as any)
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
      invalidateProjectsCache()
      fetchProjects()
    } catch (error) {
      console.error("Create project error:", error)
      toast.error("Failed to create project")
    }
  }

  if (loading) {
    return <div className="p-6">Loading projects...</div>
  }

  // Transform API projects to card format — with real task stats
  const allProjects = projects.map((p: any) => ({
    project: {
      _id: p.id,
      title: p.title,
      description: p.description,
      owner: p.owner,
      members: p.members || [],
      dueDate: p.dueDate,
      createdAt: p.createdAt
    },
    progress: p.taskStats?.completionRate ?? 0,
    taskCount: p.taskStats?.total ?? 0,
    tasksDone: p.taskStats?.done ?? 0,
    tasksInProgress: p.taskStats?.inProgress ?? 0,
    tasksTodo: p.taskStats?.todo ?? 0,
    tasksOverdue: p.taskStats?.overdue ?? 0,
    memberStats: (p.memberStats || []) as Array<{ memberId: string; total: number; done: number }>,
    status: p.status || "on_track"
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
          <Tabs
            value={viewMode}
            onValueChange={(v) => {
              setViewMode(v as any)
            }}
            className="w-full"
          >
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
                      onClick={() => {
                        setStatusFilter("all")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      All Statuses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("on_track")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      On Track
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("at_risk")
                      }}
                      className="gap-3 rounded-xl py-3 font-bold text-amber-600"
                    >
                      At Risk
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setStatusFilter("off_track")
                      }}
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
                  {filteredProjects.map(
                    ({
                      project,
                      progress,
                      taskCount,
                      tasksDone,
                      tasksInProgress,
                      tasksTodo,
                      tasksOverdue,
                      status
                    }) => (
                      <ProjectCard
                        key={project._id}
                        project={project}
                        progress={progress}
                        taskCount={taskCount}
                        tasksDone={tasksDone}
                        tasksInProgress={tasksInProgress}
                        tasksTodo={tasksTodo}
                        tasksOverdue={tasksOverdue}
                        status={status}
                      />
                    )
                  )}
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
  tasksDone: number
  tasksInProgress: number
  tasksTodo: number
  tasksOverdue: number
  status: string
}

function ProjectCard({
  project,
  progress,
  taskCount,
  tasksDone,
  tasksInProgress,
  tasksTodo,
  tasksOverdue,
  status
}: ProjectCardProps) {
  const router = useRouter()

  const statusConfig = {
    on_track: {
      label: "On Track",
      color: "bg-emerald-500",
      text: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      border: "border-emerald-100 dark:border-emerald-800"
    },
    at_risk: {
      label: "At Risk",
      color: "bg-amber-500",
      text: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      border: "border-amber-100 dark:border-amber-800"
    },
    off_track: {
      label: "Off Track",
      color: "bg-rose-500",
      text: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-900/20",
      border: "border-rose-100 dark:border-rose-800"
    },
    completed: {
      label: "Completed",
      color: "bg-blue-500",
      text: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      border: "border-blue-100 dark:border-blue-800"
    }
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.on_track
  const daysLeft = project.dueDate ? getDaysUntil(project.dueDate) : null

  return (
    <div
      className="group relative cursor-pointer"
      onClick={() => {
        router.push(`/projects/${project._id}`)
      }}
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

        <CardContent className="space-y-6 p-10 pt-4">
          {/* Progress Module */}
          <div className="space-y-3">
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
              variant={
                status === "completed"
                  ? "success"
                  : status === "at_risk"
                    ? "warning"
                    : status === "off_track"
                      ? "danger"
                      : "default"
              }
              className="h-2 bg-slate-100 dark:bg-slate-700"
            />
          </div>

          {/* Task Distribution */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Task Distribution
              </span>
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-600 dark:border-blue-800 dark:bg-blue-900/30">
                {taskCount} total
              </span>
            </div>
            {taskCount > 0 ? (
              <SegmentedProgress
                segments={[
                  { value: tasksDone, color: "bg-emerald-500 shadow-sm", label: "Done" },
                  { value: tasksInProgress, color: "bg-blue-500 shadow-sm", label: "In Progress" },
                  { value: tasksTodo, color: "bg-slate-300 dark:bg-slate-700", label: "To Do" }
                ]}
                total={taskCount}
                size="sm"
              />
            ) : (
              <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
            )}
            {/* Task count pills */}
            <div className="flex gap-2">
              <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[9px] font-black text-emerald-600 dark:bg-emerald-900/20">
                <CheckCircle className="h-2.5 w-2.5" />
                {tasksDone} Done
              </span>
              <span className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[9px] font-black text-blue-600 dark:bg-blue-900/20">
                <Zap className="h-2.5 w-2.5" />
                {tasksInProgress} Active
              </span>
              {tasksOverdue > 0 && (
                <span className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[9px] font-black text-rose-600 dark:bg-rose-900/20">
                  <AlertCircle className="h-2.5 w-2.5" />
                  {tasksOverdue} Overdue
                </span>
              )}
            </div>
          </div>

          {/* Due date + members row */}
          <div className="flex items-center justify-between border-t border-slate-50 pt-4 dark:border-slate-800">
            <div>
              {project.members && project.members.length > 0 ? (
                <div className="flex items-center gap-2">
                  <AvatarGroup
                    users={project.members.map((m: any) => ({ name: m.name, image: m.avatar }))}
                    max={4}
                    size="xs"
                  />
                  <span className="text-[9px] leading-none font-bold tracking-widest text-slate-400 uppercase">
                    {project.members.length} Member{project.members.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : (
                <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase italic">
                  No Members
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {daysLeft !== null && (
                <span
                  className={cn(
                    "rounded-lg px-2 py-1 text-[9px] font-black",
                    daysLeft < 0
                      ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                      : daysLeft <= 3
                        ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                        : "bg-slate-50 text-slate-500 dark:bg-slate-800"
                  )}
                >
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-xl text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/projects/${project._id}`)
                }}
              >
                <ArrowRight className="h-4 w-4" />
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

const MEMBER_PALETTE = [
  "#6366f1",
  "#10b981",
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16"
]

const STATUS_LABEL_INNER: Record<string, string> = {
  on_track: "On Track",
  at_risk: "At Risk",
  off_track: "Off Track",
  completed: "Done"
}

function TeamWorkloadView({ projects }: TeamWorkloadViewProps) {
  // Build member map using only tasks actually assigned to each member
  const memberMap = new Map<
    string,
    {
      _id: string
      name: string
      email: string
      avatar: string | null
      projectList: Array<{
        _id: string
        title: string
        assigned: number
        done: number
        progress: number
        status: string
      }>
      totalTasks: number
      totalDone: number
    }
  >()

  projects.forEach(({ project, memberStats, progress, status }) => {
    if (!project.members) {
      return
    }
    // Index per-member stats for this project
    const statsForMember = new Map<string, { total: number; done: number }>(
      (memberStats || []).map((s: { memberId: string; total: number; done: number }) => [
        s.memberId,
        s
      ])
    )
    project.members.forEach((m: any) => {
      const id = m._id || m.name
      if (!memberMap.has(id)) {
        memberMap.set(id, {
          _id: id,
          name: m.name || "Member",
          email: m.email || "",
          avatar: m.avatar || null,
          projectList: [],
          totalTasks: 0,
          totalDone: 0
        })
      }
      const assigned = statsForMember.get(id)?.total ?? 0
      const done = statsForMember.get(id)?.done ?? 0
      const data = memberMap.get(id)!
      // Only add project entry if member has assigned tasks
      data.projectList.push({
        _id: project._id,
        title: project.title,
        assigned,
        done,
        progress,
        status
      })
      data.totalTasks += assigned
      data.totalDone += done
    })
  })

  const members = Array.from(memberMap.values()).sort((a, b) => b.totalTasks - a.totalTasks)
  const maxTasks = Math.max(...members.map((m) => m.totalTasks), 1)

  if (members.length === 0) {
    return (
      <div className="space-y-4 rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50 py-40 text-center dark:border-slate-800 dark:bg-slate-900/10">
        <Users className="mx-auto h-12 w-12 text-slate-200" />
        <p className="text-sm font-bold text-slate-400">
          No team members assigned to projects yet.
        </p>
        <p className="text-[10px] font-black tracking-widest text-slate-300 uppercase">
          Add members when creating or editing projects
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workload bar chart header */}
      <div className="rounded-[2rem] border border-slate-100 bg-white/60 p-8 shadow-lg backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60">
        <h3 className="mb-6 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Team Workload Overview
        </h3>
        <div className="space-y-4">
          {members.map((member, i) => {
            const rate =
              member.totalTasks > 0 ? Math.round((member.totalDone / member.totalTasks) * 100) : 0
            const barWidth = Math.round((member.totalTasks / maxTasks) * 100)
            const color = MEMBER_PALETTE[i % MEMBER_PALETTE.length]
            return (
              <div key={member._id} className="flex items-center gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
                  style={{ background: color }}
                >
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-[120px]">
                  <p className="text-sm font-black text-slate-900 dark:text-white">{member.name}</p>
                  <p className="text-[9px] text-slate-400">
                    {member.projectList.length} project{member.projectList.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex-1">
                  <div className="relative h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${barWidth}%`, background: color }}
                    />
                  </div>
                </div>
                <div className="w-28 text-right">
                  {member.totalTasks > 0 ? (
                    <>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {member.totalTasks} assigned
                      </p>
                      <p className="text-[9px] font-black" style={{ color }}>
                        {rate}% done
                      </p>
                    </>
                  ) : (
                    <p className="text-[9px] font-black tracking-widest text-slate-300 uppercase">
                      No tasks assigned
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Member detail cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {members.map((member, i) => {
          const rate =
            member.totalTasks > 0 ? Math.round((member.totalDone / member.totalTasks) * 100) : 0
          const color = MEMBER_PALETTE[i % MEMBER_PALETTE.length]
          return (
            <Card
              key={member._id}
              className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl transition-all hover:-translate-y-1 dark:bg-slate-900/60"
            >
              <div className="flex flex-col space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="h-12 w-12 rounded-2xl object-cover shadow-md"
                      />
                    ) : (
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-md"
                        style={{ background: color }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-black tracking-tight text-slate-900 uppercase dark:text-white">
                        {member.name}
                      </h3>
                      <p className="text-[10px] text-slate-400">{member.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black tabular-nums" style={{ color }}>
                      {member.totalTasks}
                    </p>
                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Assigned
                    </p>
                  </div>
                </div>

                {/* Completion bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Completion
                    </span>
                    <span className="text-xs font-black" style={{ color }}>
                      {rate}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${rate}%`, background: color }}
                    />
                  </div>
                </div>

                {/* Task breakdown */}
                <div className="flex gap-3">
                  <div className="flex-1 rounded-xl bg-emerald-50 p-3 text-center dark:bg-emerald-900/20">
                    <p className="text-lg font-black text-emerald-600">{member.totalDone}</p>
                    <p className="text-[9px] font-black tracking-widest text-emerald-500 uppercase">
                      Done
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                    <p className="text-lg font-black text-blue-600">
                      {member.totalTasks - member.totalDone}
                    </p>
                    <p className="text-[9px] font-black tracking-widest text-blue-500 uppercase">
                      Remaining
                    </p>
                  </div>
                  <div className="flex-1 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-800">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-200">
                      {member.projectList.length}
                    </p>
                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Projects
                    </p>
                  </div>
                </div>

                {/* Project list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Projects
                  </span>
                  <div className="space-y-2">
                    {member.projectList.slice(0, 4).map((proj) => {
                      const memberRate =
                        proj.assigned > 0 ? Math.round((proj.done / proj.assigned) * 100) : null
                      const statusColors: Record<string, string> = {
                        on_track: "text-emerald-600",
                        at_risk: "text-amber-600",
                        off_track: "text-rose-600",
                        completed: "text-blue-600"
                      }
                      return (
                        <div
                          key={proj._id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800"
                        >
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                              {proj.title}
                            </span>
                            {proj.assigned > 0 ? (
                              <span className="text-[9px] text-slate-400">
                                {proj.done}/{proj.assigned} tasks
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-300 italic">
                                member · no tasks assigned
                              </span>
                            )}
                          </div>
                          <div className="ml-3 flex shrink-0 items-center gap-2">
                            {memberRate !== null ? (
                              <>
                                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div
                                    className="h-full rounded-full bg-indigo-500"
                                    style={{ width: `${memberRate}%` }}
                                  />
                                </div>
                                <span
                                  className={cn(
                                    "text-[9px] font-black",
                                    statusColors[proj.status] || "text-slate-400"
                                  )}
                                >
                                  {memberRate}%
                                </span>
                              </>
                            ) : (
                              <span
                                className={cn(
                                  "text-[9px] font-black",
                                  statusColors[proj.status] || "text-slate-400"
                                )}
                              >
                                {STATUS_LABEL_INNER[proj.status] || proj.status}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {member.projectList.length > 4 && (
                      <p className="text-[9px] font-black text-slate-400">
                        +{member.projectList.length - 4} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// Timeline View — Gantt-style
interface TimelineViewProps {
  projects: any[]
}

function TimelineView({ projects }: TimelineViewProps) {
  const router = useRouter()
  // Use the earliest createdAt as timeline start, today + 2w as end
  const now = new Date()
  const allDates = projects
    .map(({ project }) => [
      project.createdAt ? new Date(project.createdAt).getTime() : now.getTime(),
      project.dueDate ? new Date(project.dueDate).getTime() : null
    ])
    .flat()
    .filter(Boolean) as number[]

  const timelineStart = allDates.length > 0 ? Math.min(...allDates) : now.getTime() - 30 * 86400000
  const timelineEnd =
    Math.max(...allDates.filter((d) => d >= now.getTime()), now.getTime()) + 14 * 86400000
  const totalRange = timelineEnd - timelineStart

  const sortedProjects = [...projects].sort((a, b) => {
    const aStart = a.project.createdAt ? new Date(a.project.createdAt).getTime() : 0
    const bStart = b.project.createdAt ? new Date(b.project.createdAt).getTime() : 0
    return aStart - bStart
  })

  const STATUS_BAR: Record<string, string> = {
    on_track: "bg-blue-500",
    at_risk: "bg-amber-500",
    off_track: "bg-rose-500",
    completed: "bg-emerald-500"
  }
  const STATUS_LABEL: Record<string, string> = {
    on_track: "On Track",
    at_risk: "At Risk",
    off_track: "Off Track",
    completed: "Completed"
  }
  const STATUS_TEXT: Record<string, string> = {
    on_track: "text-blue-600",
    at_risk: "text-amber-600",
    off_track: "text-rose-600",
    completed: "text-emerald-600"
  }

  if (sortedProjects.length === 0) {
    return (
      <div className="rounded-[3rem] border-2 border-dashed border-slate-100 bg-slate-50/50 py-40 text-center dark:border-slate-800 dark:bg-slate-900/10">
        <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-200" />
        <p className="text-sm font-bold text-slate-400">No projects to display on timeline</p>
      </div>
    )
  }

  // Compute month labels for the ruler
  const startDate = new Date(timelineStart)
  const endDate = new Date(timelineEnd)
  const monthLabels: { label: string; left: number }[] = []
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  while (cur <= endDate) {
    const left = ((cur.getTime() - timelineStart) / totalRange) * 100
    monthLabels.push({
      label: cur.toLocaleString("default", { month: "short", year: "2-digit" }),
      left: Math.max(0, left)
    })
    cur.setMonth(cur.getMonth() + 1)
  }

  const todayLeft = ((now.getTime() - timelineStart) / totalRange) * 100

  return (
    <div className="space-y-6">
      {/* Gantt Card */}
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/70 shadow-xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/60">
        {/* Month ruler */}
        <div className="relative h-10 border-b border-slate-100 dark:border-slate-800">
          <div className="absolute inset-0 px-[200px]">
            <div className="relative h-full">
              {monthLabels.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-black tracking-widest text-slate-400 uppercase"
                  style={{ left: `${m.left}%` }}
                >
                  {m.label}
                </div>
              ))}
              {/* Today line */}
              {todayLeft >= 0 && todayLeft <= 100 && (
                <div
                  className="absolute top-0 h-full w-px bg-rose-400/60"
                  style={{ left: `${todayLeft}%` }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Project rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedProjects.map(
            ({ project, progress, status, taskCount, tasksDone, tasksOverdue }) => {
              const start = project.createdAt
                ? new Date(project.createdAt).getTime()
                : timelineStart
              const end = project.dueDate ? new Date(project.dueDate).getTime() : null

              const barLeft = ((start - timelineStart) / totalRange) * 100
              const barRight = end ? ((end - timelineStart) / totalRange) * 100 : todayLeft + 2
              const barWidth = Math.max(barRight - barLeft, 2)

              const daysLeft = project.dueDate ? getDaysUntil(project.dueDate) : null
              const isOverdue = daysLeft !== null && daysLeft < 0

              return (
                <div
                  key={project._id}
                  className="group flex cursor-pointer items-center hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  onClick={() => {
                    router.push(`/projects/${project._id}`)
                  }}
                >
                  {/* Left label */}
                  <div className="flex w-[200px] shrink-0 items-center gap-3 border-r border-slate-100 px-4 py-4 dark:border-slate-800">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        STATUS_BAR[status] || "bg-slate-400"
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-900 group-hover:text-blue-600 dark:text-white">
                        {project.title}
                      </p>
                      <p
                        className={cn(
                          "text-[9px] font-black",
                          STATUS_TEXT[status] || "text-slate-400"
                        )}
                      >
                        {STATUS_LABEL[status] || status}
                      </p>
                    </div>
                  </div>

                  {/* Gantt bar area */}
                  <div className="relative flex-1 px-2 py-4">
                    <div className="relative h-8">
                      {/* Today line */}
                      {todayLeft >= 0 && todayLeft <= 100 && (
                        <div
                          className="pointer-events-none absolute top-0 z-10 h-full w-px bg-rose-400/50"
                          style={{ left: `${todayLeft}%` }}
                        />
                      )}
                      {/* Background track */}
                      <div className="absolute inset-0 rounded-lg bg-slate-100/80 dark:bg-slate-800/80" />
                      {/* Project bar */}
                      <div
                        className={cn(
                          "absolute top-0 h-full rounded-lg opacity-20",
                          STATUS_BAR[status] || "bg-slate-400"
                        )}
                        style={{
                          left: `${Math.max(barLeft, 0)}%`,
                          width: `${Math.min(barWidth, 100 - Math.max(barLeft, 0))}%`
                        }}
                      />
                      {/* Progress fill */}
                      <div
                        className={cn(
                          "absolute top-0 h-full rounded-lg",
                          STATUS_BAR[status] || "bg-slate-400"
                        )}
                        style={{
                          left: `${Math.max(barLeft, 0)}%`,
                          width: `${Math.min((barWidth * progress) / 100, 100 - Math.max(barLeft, 0))}%`
                        }}
                      />
                      {/* Progress label inside bar */}
                      {barWidth > 8 && (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 px-2 text-[9px] font-black text-white"
                          style={{ left: `${Math.max(barLeft, 0)}%` }}
                        >
                          {progress}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right stats */}
                  <div className="flex w-[160px] shrink-0 items-center justify-end gap-4 border-l border-slate-100 px-4 py-4 dark:border-slate-800">
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-900 tabular-nums dark:text-white">
                        {tasksDone}/{taskCount}
                      </p>
                      <p className="text-[9px] font-black text-slate-400">tasks done</p>
                    </div>
                    <div className="text-right">
                      {daysLeft !== null ? (
                        <>
                          <p
                            className={cn(
                              "text-xs font-black tabular-nums",
                              isOverdue
                                ? "text-rose-600"
                                : daysLeft <= 7
                                  ? "text-amber-600"
                                  : "text-slate-600 dark:text-slate-300"
                            )}
                          >
                            {isOverdue ? `-${Math.abs(daysLeft)}d` : `${daysLeft}d`}
                          </p>
                          <p className="text-[9px] font-black text-slate-400">
                            {isOverdue ? "overdue" : "left"}
                          </p>
                        </>
                      ) : (
                        <p className="text-[9px] font-black text-slate-300">no deadline</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 border-t border-slate-100 px-6 py-3 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <div className="h-px w-6 border-t-2 border-dashed border-rose-400" />
            <span className="text-[9px] font-black text-slate-400">Today</span>
          </div>
          {["on_track", "at_risk", "off_track", "completed"].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={cn("h-2.5 w-2.5 rounded-full", STATUS_BAR[s])} />
              <span className="text-[9px] font-black text-slate-400">{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary rows */}
      <div className="space-y-3">
        {sortedProjects.map(({ project, progress, status, taskCount, tasksDone, tasksOverdue }) => {
          const daysLeft = project.dueDate ? getDaysUntil(project.dueDate) : null
          const isOverdue = daysLeft !== null && daysLeft < 0
          return (
            <div
              key={project._id}
              className="group flex cursor-pointer items-center gap-5 rounded-2xl border border-slate-100 bg-white/60 px-6 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/40"
              onClick={() => {
                router.push(`/projects/${project._id}`)
              }}
            >
              <div
                className={cn(
                  "h-3 w-3 shrink-0 rounded-full",
                  STATUS_BAR[status] || "bg-slate-400"
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black tracking-tight text-slate-900 group-hover:text-blue-600 dark:text-white">
                  {project.title}
                </p>
                <p className="text-[10px] text-slate-400">
                  {project.description || "No description"}
                </p>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div className="text-center">
                  <p className="font-black text-slate-900 dark:text-white">{progress}%</p>
                  <p className="text-[9px] text-slate-400">complete</p>
                </div>
                <div className="text-center">
                  <p className="font-black text-slate-900 dark:text-white">
                    {tasksDone}/{taskCount}
                  </p>
                  <p className="text-[9px] text-slate-400">tasks</p>
                </div>
                {project.members?.length > 0 && (
                  <AvatarGroup
                    users={project.members.map((m: any) => ({ name: m.name, image: m.avatar }))}
                    max={3}
                    size="xs"
                  />
                )}
                <div className="text-right">
                  {daysLeft !== null ? (
                    <span
                      className={cn(
                        "rounded-lg px-2 py-1 text-[9px] font-black",
                        isOverdue
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                          : daysLeft <= 7
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20"
                            : "bg-slate-50 text-slate-500 dark:bg-slate-800"
                      )}
                    >
                      {isOverdue ? `${Math.abs(daysLeft)}d late` : `${daysLeft}d left`}
                    </span>
                  ) : (
                    <span className="text-[9px] text-slate-300">No deadline</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
