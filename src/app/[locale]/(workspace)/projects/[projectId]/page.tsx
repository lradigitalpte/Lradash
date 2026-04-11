"use client"

import {
  Plus,
  LayoutGrid,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Activity,
  CheckCircle2,
  ArrowUpRight,
  Target,
  Sparkles,
  MoreHorizontal,
  Layers,
  Zap,
  ChevronRight,
  Shield,
  Briefcase,
  Info,
  Search,
  BarChart3
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function ProjectPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
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

  const projectTasks = useMemo(() => {
    // Filter out deleted tasks (where deletedAt is null or doesn't exist)
    return (project?.tasks || []).filter((t: any) => !t.deletedAt)
  }, [project])

  const totalTasks = projectTasks.length
  const todoTasks = projectTasks.filter((t: any) => t.status === "TODO").length
  const inProgressTasks = projectTasks.filter(
    (t: any) => t.status === "IN_PROGRESS" || t.status === "DOING"
  ).length
  const doneTasks = projectTasks.filter((t: any) => t.status === "DONE").length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Get recent tasks (last 5 tasks sorted by updated date, excluding deleted tasks)
  const recentTasks = useMemo(() => {
    return [...projectTasks]
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [projectTasks])

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center space-y-3">
        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl bg-blue-600/10">
          <Zap className="h-5 w-5 text-blue-600" />
        </div>
        <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Loading Project...
        </p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-[420px] items-center justify-center p-5">
        <Card className="w-full max-w-md rounded-2xl border-none bg-white p-6 text-center shadow-2xl dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20">
            <Shield className="h-6 w-6 text-rose-500" />
          </div>
          <h2 className="mb-2 text-xl font-black">{error || "Access Denied"}</h2>
          <p className="mb-6 font-medium text-slate-500 italic">
            The requested project details could not be found.
          </p>
          <Link href={`/${locale}/projects`}>
            <Button className="h-10 w-full rounded-lg bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900">
              Return to Projects
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-6 bg-transparent p-5 pb-20 font-sans md:p-6 md:pb-24">
      {/* 1. Project Header */}
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 transform items-center justify-center rounded-xl bg-blue-600/95 text-white shadow-lg ring-1 shadow-blue-500/25 ring-blue-400/30 backdrop-blur-md transition-all duration-500 hover:rotate-6 dark:shadow-blue-500/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <Badge
                variant="outline"
                className="h-5 border-slate-200 bg-white px-2 text-[9px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
              >
                Project Dashboard
              </Badge>
              <div className="mt-0.5 flex items-center gap-1.5 text-[9px] font-black tracking-widest text-slate-400">
                <Clock className="h-2.5 w-2.5" />
                CREATED: {new Date(project.createdAt).toLocaleDateString()}
                <span className="mx-0.5">•</span>
                <Activity className="h-2.5 w-2.5" />
                UPDATED: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <h1 className="text-3xl leading-tight font-black tracking-tighter text-foreground md:text-4xl">
            {project.title}
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed font-medium text-muted-foreground italic md:text-base">
            {project.description || "No description provided for this project."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link href={`/${locale}/projects/${projectId}/board`}>
            <Button className="group h-10 gap-1.5 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 hover:bg-blue-700">
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Project Stats */}
      <div className="grid gap-4 pt-2 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Tasks",
            value: totalTasks,
            sub: "Tasks",
            icon: Layers,
            color: "blue",
            trend: "+4%"
          },
          {
            label: "In Progress",
            value: inProgressTasks,
            sub: "Active tasks",
            icon: Zap,
            color: "orange",
            trend: "Steady"
          },
          {
            label: "Completed",
            value: doneTasks,
            sub: "Finished tasks",
            icon: CheckCircle2,
            color: "green",
            trend: "+12%"
          },
          {
            label: "Completion Rate",
            value: `${completionRate}%`,
            sub: "Overall progress",
            icon: TrendingUp,
            color: "purple",
            trend: "+2.4%"
          }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-2xl border-none bg-white shadow-lg shadow-slate-200/40 transition-all hover:-translate-y-0.5 dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full bg-slate-50 px-1.5 py-0.5 text-[9px] font-black text-slate-400 dark:bg-slate-800"
                >
                  {stat.trend}
                </Badge>
              </div>
              <div className="mb-0.5 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-3xl font-black text-slate-900 tabular-nums dark:text-white">
                {stat.value}
              </div>
              <p className="mt-1.5 flex cursor-help items-center gap-1 text-[9px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-blue-500">
                <Info className="h-2.5 w-2.5" />
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* 3. Progress Tracking */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-lg shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-5 pb-2 md:p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-lg font-black md:text-xl">Project Progress</CardTitle>
                  <CardDescription className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Total progress overview
                  </CardDescription>
                </div>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-5 pt-3 md:p-6 md:pt-4">
              <div className="space-y-3">
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-2xl leading-none font-black text-blue-600 md:text-3xl">
                      {completionRate}%
                    </span>
                    <p className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      Completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase md:text-xs">
                      Target: End of Year
                    </span>
                  </div>
                </div>
                <div className="h-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-1 shadow-inner dark:border-slate-800 dark:bg-slate-950">
                  <div
                    className="group relative h-full rounded-lg bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 transition-all duration-1000"
                    style={{ width: `${completionRate}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-16 translate-x-8 bg-white/20 blur-lg" />
                    {completionRate > 5 && (
                      <Zap className="absolute top-1/2 right-1.5 h-2 w-2 -translate-y-1/2 animate-pulse text-white" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: "Todo", val: todoTasks, color: "bg-slate-400", sub: "Tasks queued" },
                  {
                    label: "In Progress",
                    val: inProgressTasks,
                    color: "bg-blue-500",
                    sub: "Currently active"
                  },
                  { label: "Done", val: doneTasks, color: "bg-emerald-500", sub: "Tasks completed" }
                ].map((phase, i) => (
                  <div
                    key={i}
                    className="group relative space-y-1 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className={cn("absolute top-0 bottom-0 left-0 w-0.5", phase.color)} />
                    <div className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {phase.label}
                    </div>
                    <div className="text-xl font-black text-slate-900 tabular-nums dark:text-white">
                      {phase.val}
                    </div>
                    <div className="truncate text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                      {phase.sub}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Recent Tasks */}
          <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-lg shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-5 pb-2 md:p-6">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black md:text-xl">Recent Tasks</CardTitle>
                  <CardDescription className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                    Latest task updates
                  </CardDescription>
                </div>
                <Link href={`/${locale}/projects/${projectId}/work-packages`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    View All <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-3 md:p-6 md:pt-4">
              {recentTasks.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50 py-12 text-center dark:border-slate-800 dark:bg-slate-950">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg dark:bg-slate-900">
                    <Sparkles className="h-7 w-7 text-slate-200" />
                  </div>
                  <h3 className="mb-1.5 text-lg font-black italic">No tasks yet</h3>
                  <p className="mx-auto mb-5 max-w-xs text-sm font-medium text-slate-400">
                    No tasks have been added to this project yet.
                  </p>
                  <Link href={`/${locale}/projects/${projectId}/board`}>
                    <Button className="h-10 rounded-lg bg-blue-600 px-6 text-sm font-black shadow-lg shadow-blue-500/20">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Create First Task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div
                      key={task._id}
                      className="group relative flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-slate-50/50 p-4 transition-all hover:border-blue-500/20 hover:bg-white dark:bg-slate-950/20 dark:hover:bg-slate-900"
                    >
                      <div className="flex flex-1 items-center gap-4">
                        <div className="relative">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-all group-hover:scale-105",
                              task.status === "DONE"
                                ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/10"
                                : task.status === "IN_PROGRESS" || task.status === "DOING"
                                  ? "bg-blue-50 text-blue-600 shadow-blue-500/10"
                                  : "border border-slate-100 bg-white text-slate-400 dark:bg-slate-900"
                            )}
                          >
                            {task.status === "DONE" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : task.status === "IN_PROGRESS" || task.status === "DOING" ? (
                              <Zap className="h-4 w-4 animate-pulse" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </div>
                          <div
                            className={cn(
                              "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                              task.priority === "HIGH"
                                ? "bg-rose-500"
                                : task.priority === "MEDIUM"
                                  ? "bg-amber-500"
                                  : "bg-slate-300"
                            )}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm leading-snug font-black text-slate-900 transition-colors group-hover:text-blue-600 md:text-base dark:text-white">
                            {task.title}
                          </h4>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 underline decoration-slate-200 decoration-1 underline-offset-2">
                            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                              {task.status.replace("_", " ")}
                            </span>
                            <span className="text-[9px] font-black text-slate-300 uppercase">
                              /
                            </span>
                            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                              Modified {new Date(task.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <div className="hidden -space-x-2 sm:flex">
                          {task.assignee ? (
                            <Avatar className="h-8 w-8 rounded-xl border-2 border-white shadow-md transition-transform group-hover:translate-x-[-4px] dark:border-slate-900">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="bg-blue-600 text-[10px] font-black text-white">
                                {task.assignee.name?.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white bg-slate-100 text-slate-400 shadow-inner dark:border-slate-900">
                              <Plus className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-0 transition-all group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 5. Quick Access (Quick Actions) */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-1.5 px-1 text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
            <Activity className="h-2.5 w-2.5" />
            Project Modules
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              {
                label: "Board View",
                desc: "Kanban Board",
                icon: LayoutGrid,
                color: "blue",
                href: "board",
                accent: "bg-blue-50 text-blue-600"
              },
              {
                label: "Task List",
                desc: "View all tasks",
                icon: Activity,
                color: "orange",
                href: "tasks",
                accent: "bg-orange-50 text-orange-600"
              },
              {
                label: "Calendar",
                desc: "Dates & Deadlines",
                icon: Calendar,
                color: "green",
                href: "calendar",
                accent: "bg-green-50 text-green-600"
              },
              {
                label: "Team Members",
                desc: "Project Contributors",
                icon: Users,
                color: "purple",
                href: "team",
                accent: "bg-purple-50 text-purple-600"
              },
              {
                label: "SEO Dashboard",
                desc: "Search Performance",
                icon: BarChart3,
                color: "emerald",
                href: "marketing/hub",
                accent: "bg-emerald-50 text-emerald-600"
              }
            ].map((module, i) => (
              <Link key={i} href={`/${locale}/projects/${projectId}/${module.href}`}>
                <Card className="group relative cursor-pointer overflow-hidden rounded-xl border-none bg-white shadow-md shadow-slate-200/40 transition-all hover:scale-[1.01] dark:bg-slate-900">
                  <CardContent className="p-4 md:p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl shadow-inner",
                          module.accent
                        )}
                      >
                        <module.icon className="h-5 w-5 transition-all group-hover:scale-105" />
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 transition-all group-hover:bg-blue-50 group-hover:text-blue-500">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mb-0.5 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                      {module.desc}
                    </div>
                    <div className="text-lg leading-tight font-black text-slate-900 md:text-xl dark:text-white">
                      {module.label}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* AI Insight Box */}
          <Card className="relative overflow-hidden rounded-2xl border-none bg-slate-900 p-5 text-white shadow-lg">
            <div className="absolute top-0 right-0 scale-125 rotate-12 transform p-4 opacity-20">
              <Sparkles className="h-16 w-16" />
            </div>
            <div className="relative space-y-3">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-md shadow-blue-500/50" />
                <span className="text-[9px] font-black tracking-[0.2em] text-blue-400 uppercase">
                  AI Project Insights
                </span>
              </div>
              <h4 className="text-base leading-snug font-black italic md:text-lg">
                Project is currently tracking 14% ahead of schedule.
              </h4>
              <p className="text-[11px] leading-relaxed font-medium text-slate-400 md:text-xs">
                Current progress suggests all milestones within the 'In Progress' phase will be
                finished by the end of the week.
              </p>
              <Button
                variant="outline"
                className="h-9 w-full gap-1.5 rounded-lg border-white/10 bg-white/5 text-[9px] font-black tracking-widest text-white uppercase hover:bg-white/10"
              >
                Generate Full Report <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
