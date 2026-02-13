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
  Share2,
  Info
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

  const projectTasks = useMemo(() => project?.tasks || [], [project])
  const totalTasks = projectTasks.length
  const todoTasks = projectTasks.filter((t: any) => t.status === "TODO").length
  const inProgressTasks = projectTasks.filter(
    (t: any) => t.status === "IN_PROGRESS" || t.status === "DOING"
  ).length
  const doneTasks = projectTasks.filter((t: any) => t.status === "DONE").length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Get recent tasks (last 5 tasks sorted by updated date)
  const recentTasks = useMemo(() => {
    return [...projectTasks]
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [projectTasks])

  if (loading) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center space-y-4">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-blue-600/10">
          <Zap className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Loading Project...
        </p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-[600px] items-center justify-center p-8">
        <Card className="w-full max-w-md rounded-[2rem] border-none bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20">
            <Shield className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="mb-2 text-2xl font-black">{error || "Access Denied"}</h2>
          <p className="mb-8 font-medium text-slate-500 italic">
            The requested project details could not be found.
          </p>
          <Link href={`/${locale}/projects`}>
            <Button className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900">
              Return to Projects
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-10 bg-slate-50/30 p-8 pb-32 font-sans dark:bg-slate-950/30">
      {/* 1. Project Header */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 transition-all duration-500 hover:rotate-6">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <Badge
                variant="outline"
                className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
              >
                Project Dashboard
              </Badge>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                <Clock className="h-3 w-3" />
                CREATED: {new Date(project.createdAt).toLocaleDateString()}
                <span className="mx-1">•</span>
                <Activity className="h-3 w-3" />
                UPDATED: {new Date(project.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <h1 className="text-5xl leading-tight font-black tracking-tighter text-slate-900 dark:text-white">
            {project.title}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed font-medium text-slate-500 italic">
            {project.description || "No description provided for this project."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Button
            variant="outline"
            className="h-14 gap-2 rounded-2xl border-slate-200 bg-white px-6 font-bold transition-all hover:scale-105 dark:bg-slate-900"
          >
            <Share2 className="h-4 w-4" />
            Collaborate
          </Button>
          <Link href={`/${locale}/projects/${projectId}/board`}>
            <Button className="group h-14 gap-2 rounded-2xl bg-blue-600 px-8 font-black text-white shadow-2xl shadow-blue-500/30 transition-all hover:scale-105 hover:bg-blue-700">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Project Stats */}
      <div className="grid gap-6 pt-4 md:grid-cols-2 lg:grid-cols-4">
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
            className="group overflow-hidden rounded-[2rem] border-none bg-white shadow-2xl shadow-slate-200/40 transition-all hover:-translate-y-1 dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-8">
              <div className="mb-6 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-black text-slate-400 dark:bg-slate-800"
                >
                  {stat.trend}
                </Badge>
              </div>
              <div className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-4xl font-black text-slate-900 tabular-nums dark:text-white">
                {stat.value}
              </div>
              <p className="mt-2 flex cursor-help items-center gap-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase transition-colors group-hover:text-blue-500">
                <Info className="h-3 w-3" />
                {stat.sub}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 3. Progress Tracking */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-10 pb-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black">Project Progress</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Total progress overview
                  </CardDescription>
                </div>
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-10 p-10 pt-6">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-3xl leading-none font-black text-blue-600">
                      {completionRate}%
                    </span>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Completed
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                      Target: End of Year
                    </span>
                  </div>
                </div>
                <div className="h-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-1.5 shadow-inner dark:border-slate-800 dark:bg-slate-950">
                  <div
                    className="group relative h-full rounded-xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 transition-all duration-1000"
                    style={{ width: `${completionRate}%` }}
                  >
                    <div className="absolute top-0 right-0 h-full w-24 translate-x-12 bg-white/20 blur-xl" />
                    {completionRate > 5 && (
                      <Zap className="absolute top-1/2 right-2 h-2.5 w-2.5 -translate-y-1/2 animate-pulse text-white" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
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
                    className="group relative space-y-2 overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                  >
                    <div className={cn("absolute top-0 bottom-0 left-0 w-1", phase.color)} />
                    <div className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {phase.label}
                    </div>
                    <div className="text-2xl font-black text-slate-900 tabular-nums dark:text-white">
                      {phase.val}
                    </div>
                    <div className="truncate text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                      {phase.sub}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Recent Tasks */}
          <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
            <CardHeader className="p-10 pb-4">
              <div className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-black">Recent Tasks</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Latest task updates
                  </CardDescription>
                </div>
                <Link href={`/${locale}/projects/${projectId}/work-packages`}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 rounded-xl font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  >
                    View All <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-6">
              {recentTasks.length === 0 ? (
                <div className="rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50 py-20 text-center dark:border-slate-800 dark:bg-slate-950">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl dark:bg-slate-900">
                    <Sparkles className="h-10 w-10 text-slate-200" />
                  </div>
                  <h3 className="mb-2 text-xl font-black italic">No tasks yet</h3>
                  <p className="mx-auto mb-8 max-w-xs font-medium text-slate-400">
                    No tasks have been added to this project yet.
                  </p>
                  <Link href={`/${locale}/projects/${projectId}/board`}>
                    <Button className="h-12 rounded-xl bg-blue-600 px-8 font-black shadow-xl shadow-blue-500/20">
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Task
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentTasks.map((task) => (
                    <div
                      key={(task)._id}
                      className="group relative flex cursor-pointer items-center justify-between rounded-[2rem] border border-transparent bg-slate-50/50 p-6 transition-all hover:border-blue-500/20 hover:bg-white dark:bg-slate-950/20 dark:hover:bg-slate-900"
                    >
                      <div className="flex flex-1 items-center gap-6">
                        <div className="relative">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-all group-hover:scale-110",
                              task.status === "DONE"
                                ? "bg-emerald-50 text-emerald-600 shadow-emerald-500/10"
                                : task.status === "IN_PROGRESS" || task.status === "DOING"
                                  ? "bg-blue-50 text-blue-600 shadow-blue-500/10"
                                  : "border border-slate-100 bg-white text-slate-400 dark:bg-slate-900"
                            )}
                          >
                            {task.status === "DONE" ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : task.status === "IN_PROGRESS" || task.status === "DOING" ? (
                              <Zap className="h-5 w-5 animate-pulse" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          <div
                            className={cn(
                              "absolute -right-1 -bottom-1 h-4 w-4 rounded-full border-2 border-white dark:border-slate-900",
                              task.priority === "HIGH"
                                ? "bg-rose-500"
                                : task.priority === "MEDIUM"
                                  ? "bg-amber-500"
                                  : "bg-slate-300"
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <h4 className="leading-snug font-black text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white">
                            {task.title}
                          </h4>
                          <div className="mt-1 flex items-center gap-3 underline decoration-slate-200 decoration-1 underline-offset-4">
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              {task.status.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-black text-slate-300 uppercase">
                              /
                            </span>
                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                              Modified {new Date((task).updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden -space-x-3 sm:flex">
                          {task.assignee ? (
                            <Avatar className="h-10 w-10 rounded-2xl border-4 border-white shadow-xl transition-transform group-hover:translate-x-[-8px] dark:border-slate-900">
                              <AvatarImage src={task.assignee.avatar} />
                              <AvatarFallback className="bg-blue-600 text-xs font-black text-white">
                                {task.assignee.name?.slice(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 text-slate-400 shadow-inner dark:border-slate-900">
                              <Plus className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl opacity-0 transition-all group-hover:opacity-100"
                        >
                          <MoreHorizontal className="h-5 w-5 text-slate-400" />
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
        <div className="space-y-8">
          <h3 className="flex items-center gap-2 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            <Activity className="h-3 w-3" />
            Project Modules
          </h3>
          <div className="grid grid-cols-1 gap-4">
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
              }
            ].map((module, i) => (
              <Link key={i} href={`/${locale}/projects/${projectId}/${module.href}`}>
                <Card className="group relative cursor-pointer overflow-hidden rounded-[2rem] border-none bg-white shadow-xl shadow-slate-200/40 transition-all hover:scale-[1.02] dark:bg-slate-900">
                  <CardContent className="p-8">
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-inner",
                          module.accent
                        )}
                      >
                        <module.icon className="h-7 w-7 transition-all group-hover:scale-110" />
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-slate-300 transition-all group-hover:bg-blue-50 group-hover:text-blue-500">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                    </div>
                    <div className="mb-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      {module.desc}
                    </div>
                    <div className="text-2xl leading-tight font-black text-slate-900 dark:text-white">
                      {module.label}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* AI Insight Box */}
          <Card className="relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 p-8 text-white shadow-2xl">
            <div className="absolute top-0 right-0 scale-150 rotate-12 transform p-8 opacity-20">
              <Sparkles className="h-24 w-24" />
            </div>
            <div className="relative space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                <span className="text-[10px] font-black tracking-[0.2em] text-blue-400 uppercase">
                  AI Project Insights
                </span>
              </div>
              <h4 className="text-xl leading-tight font-black italic">
                Project is currently tracking 14% ahead of schedule.
              </h4>
              <p className="text-xs leading-relaxed font-medium text-slate-400">
                Current progress suggests all milestones within the 'In Progress' phase will be
                finished by the end of the week.
              </p>
              <Button
                variant="outline"
                className="h-12 w-full gap-2 rounded-xl border-white/10 bg-white/5 text-[10px] font-black tracking-widest text-white uppercase hover:bg-white/10"
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
