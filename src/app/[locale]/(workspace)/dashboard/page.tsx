"use client"

import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Plus,
  TrendingUp,
  Users
} from "lucide-react"
import { useEffect, useState } from "react"

import {
  ActivityFeed,
  AvatarGroup,
  ProgressBar,
  SegmentedProgress,
  StatCard,
  StatusBadge
} from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBoards } from "@/hooks/useBoards"
import { useProjectStats } from "@/hooks/useProjectStats"
import { useRecentActivity } from "@/hooks/useRecentActivity"
import { useTaskStats } from "@/hooks/useTaskStats"
import { Link } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"
import { cn, formatDate } from "@/lib/utils"

export default function DashboardPage() {
  const userId = useTaskStore((state) => state.userId)
  const boardId = useTaskStore((state) => state.currentBoardId)
  const fetchProjects = useTaskStore((state) => state.fetchProjects)
  const { myBoards, teamBoards } = useBoards()
  const taskStats = useTaskStats(userId)
  const projectStats = useProjectStats()
  const recentActivity = useRecentActivity(5)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])

  // Fetch projects on mount
  useEffect(() => {
    if (myBoards && myBoards.length > 0) {
      const boardToLoad = myBoards[0]
      fetchProjects(boardToLoad._id)
    }
  }, [myBoards, fetchProjects])

  // Fetch calendar events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiClient.get("/api/events")
        if (response.ok) {
          const events = await response.json()
          const now = new Date()
          const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

          const upcoming = events
            .filter((event: any) => {
              const eventStart = new Date(event.startTime)
              return eventStart >= now && eventStart <= inThreeDays
            })
            .sort(
              (a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            )
            .slice(0, 5)

          setUpcomingEvents(upcoming)
        }
      } catch (error) {
        console.error("Failed to fetch calendar events:", error)
      }
    }

    fetchEvents()
  }, [])

  const allBoards = [...(myBoards || []), ...(teamBoards || [])]

  return (
    <div className="relative min-h-full pb-20">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-20 left-[5%] -z-10 h-[400px] w-[400px] rounded-full bg-indigo-500/5 blur-[100px]" />
      <div className="pointer-events-none absolute top-[40%] left-[30%] -z-10 h-[300px] w-[300px] rounded-full bg-emerald-500/5 blur-[80px]" />

      <div className="mx-auto max-w-[1600px] space-y-12 p-8 lg:p-12">
        {/* WOW Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <TrendingUp className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Quick Overview
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                  System Active
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Project{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                Welcome back! Analyzing project stats & team activity...
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            <Button
              size="lg"
              className="h-14 gap-3 rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
              asChild
            >
              <Link href="/boards?new=true">
                <Plus className="h-5 w-5 stroke-[3]" />
                New Board
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Project Tasks"
            value={taskStats.total}
            subtitle={`${taskStats.byStatus.DONE} completed tasks`}
            icon={ListTodo}
            variant="default"
          />
          <StatCard
            title="Tasks In Progress"
            value={taskStats.byStatus.IN_PROGRESS}
            subtitle="Currently active tasks"
            icon={Clock}
            variant="primary"
          />
          <StatCard
            title="Task Success"
            value={taskStats.byStatus.DONE}
            subtitle={`${taskStats.completionRate}% completion rate`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Overdue Tasks"
            value={taskStats.overdue}
            subtitle="Needs immediate attention"
            icon={AlertCircle}
            variant={taskStats.overdue > 0 ? "danger" : "default"}
          />
        </div>

        {/* Main Interface Layout */}
        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          {/* Main Project Overview */}
          <div className="space-y-10">
            {/* Performance Visualization */}
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none">
              <CardHeader className="p-10 pb-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                        Project Progress
                      </h3>
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        Overall Project Health
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 p-10 pt-4">
                <SegmentedProgress
                  segments={[
                    {
                      value: taskStats.byStatus.DONE,
                      color: "bg-emerald-500/80 shadow-lg shadow-emerald-500/20",
                      label: "Completed"
                    },
                    {
                      value: taskStats.byStatus.IN_PROGRESS,
                      color: "bg-blue-500/80 shadow-lg shadow-blue-500/20",
                      label: "In Progress"
                    },
                    {
                      value: taskStats.byStatus.TODO,
                      color: "bg-slate-300 dark:bg-slate-700",
                      label: "To Do"
                    }
                  ]}
                  total={taskStats.total || 1}
                  size="lg"
                  showLegend
                />
              </CardContent>
            </Card>

            {/* Recent Projects */}
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/40 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/40">
              <CardHeader className="flex flex-row items-center justify-between p-10 pb-6">
                <div>
                  <div className="mb-1 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                      <FolderKanban className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                        Active Projects
                      </h3>
                      <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        {projectStats.totalProjects} Total Active Projects
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="gap-2 rounded-xl font-bold text-indigo-600 hover:bg-white dark:hover:bg-slate-800"
                  asChild
                >
                  <Link href="/boards">
                    View All Projects
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                {projectStats.projectsWithProgress.length === 0 ? (
                  <div className="space-y-6 py-20 text-center">
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[3rem] border border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-200 dark:border-indigo-800 dark:bg-indigo-900/10">
                      <FolderKanban className="h-10 w-10" />
                    </div>
                    <div>
                      <h4 className="mb-2 text-2xl font-black text-slate-900 italic dark:text-white">
                        No Active Projects
                      </h4>
                      <p className="text-sm font-medium text-slate-500 italic">
                        You don't have any active projects yet.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="h-14 rounded-2xl border-slate-200 px-8 font-black shadow-sm"
                      asChild
                    >
                      <Link href="/boards?new=true">Create Your First Project</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {projectStats.projectsWithProgress
                      .slice(0, 5)
                      .map(({ project, progress, taskCount }) => (
                        <div
                          key={project._id}
                          className="group rounded-[2rem] border border-slate-100 bg-white/50 p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 dark:border-slate-800/50 dark:bg-slate-800/30 dark:hover:bg-slate-800"
                        >
                          <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 font-black text-white dark:bg-white dark:text-slate-900">
                                  {project.title.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold tracking-wide text-slate-900 uppercase transition-colors group-hover:text-blue-600 dark:text-white">
                                    {project.title}
                                  </span>
                                  <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    {taskCount} Tasks Assigned
                                  </span>
                                </div>
                              </div>
                              <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                                <span className="text-sm font-black text-blue-600 tabular-nums">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                            <ProgressBar
                              value={progress}
                              size="sm"
                              className="bg-slate-100 dark:bg-slate-700"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Kanban Boards */}
            <Card className="group relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 text-white shadow-2xl shadow-slate-200/50 dark:bg-white dark:text-slate-900">
              <div className="pointer-events-none absolute top-0 right-0 h-80 w-80 bg-blue-600/20 blur-[120px] transition-colors group-hover:bg-blue-600/30" />
              <CardHeader className="relative z-10 flex flex-row items-center justify-between p-10 pb-6">
                <div>
                  <h3 className="text-2xl font-black tracking-tight italic">Main Boards</h3>
                  <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-50">
                    Project Groups
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="gap-2 rounded-xl font-bold text-white hover:bg-white/10 dark:text-slate-900 dark:hover:bg-slate-100"
                  asChild
                >
                  <Link href="/boards?new=true">
                    <Plus className="h-4 w-4" />
                    New Board
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="relative z-10 px-10 pb-10">
                {allBoards.length === 0 ? (
                  <div className="py-12 text-center font-medium text-white/40 italic dark:text-slate-400">
                    No boards have been established yet.
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {allBoards.slice(0, 4).map((board) => (
                      <Link
                        key={board._id}
                        href={`/boards/${board._id}`}
                        className="group rounded-[2rem] border border-white/10 bg-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-2xl hover:shadow-slate-900/20 dark:border-slate-200 dark:bg-slate-50 dark:hover:bg-slate-100 dark:hover:shadow-slate-200/50"
                      >
                        <div className="flex h-full flex-col justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="text-lg font-black tracking-tight uppercase transition-colors group-hover:text-blue-400 dark:group-hover:text-blue-600">
                              {board.title}
                            </h4>
                            <p className="line-clamp-2 text-xs font-medium text-white/60 italic dark:text-slate-500">
                              {board.description || "No description provided..."}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1 text-[10px] font-black tracking-widest uppercase dark:bg-slate-200">
                              <FolderKanban className="h-3 w-3" />
                              {board.projects?.length || 0} Projects
                            </div>
                            {board.members && board.members.length > 0 && (
                              <AvatarGroup
                                users={board.members.map((m) => ({ name: m.name }))}
                                max={3}
                                size="xs"
                              />
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Insights */}
          <div className="space-y-8">
            {/* Quick Analytics */}
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none">
              <CardHeader className="border-b border-slate-50 p-8 pb-4 dark:border-slate-800">
                <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">
                  Quick Stats
                </h3>
              </CardHeader>
              <CardContent className="space-y-6 p-8">
                {[
                  { label: "Due Today", value: taskStats.dueToday, color: "text-rose-600" },
                  { label: "High Priority", value: taskStats.dueSoon, color: "text-amber-600" },
                  {
                    label: "Assigned to Me",
                    value: taskStats.assignedToMe,
                    color: "text-blue-600"
                  },
                  { label: "Global Total", value: allBoards.length, sub: "Boards" }
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0 dark:border-slate-800"
                  >
                    <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      {stat.label}
                    </span>
                    <span
                      className={cn(
                        "font-sans text-xl font-black tabular-nums",
                        stat.color || "text-slate-900 dark:text-white"
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Schedule Overview */}
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/40 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/40 dark:shadow-none">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">
                    Timeline Overview
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-2">
                {upcomingEvents.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase italic opacity-60">
                      No upcoming deadlines
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event: any) => {
                      const eventDate = new Date(event.startTime)
                      const isToday = eventDate.toDateString() === new Date().toDateString()
                      const isSoon =
                        eventDate.getTime() - new Date().getTime() < 3 * 24 * 60 * 60 * 1000

                      return (
                        <div
                          key={event._id}
                          className={cn(
                            "flex items-center gap-4 rounded-2xl p-4 shadow-sm transition-transform hover:scale-[1.02]",
                            isToday
                              ? "border border-rose-100 bg-rose-50/50 dark:border-rose-900 dark:bg-rose-950/20"
                              : "border border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
                          )}
                        >
                          <AlertCircle
                            className={cn("h-5 w-5", isToday ? "text-rose-500" : "text-blue-500")}
                          />
                          <div>
                            <p
                              className={cn(
                                "mb-1 text-sm leading-none font-black tracking-tight uppercase",
                                isToday
                                  ? "text-rose-900 dark:text-rose-400"
                                  : "text-blue-900 dark:text-blue-400"
                              )}
                            >
                              {event.title}
                            </p>
                            <p
                              className={cn(
                                "text-[10px] font-bold tracking-widest uppercase",
                                isToday
                                  ? "text-rose-600/70 dark:text-rose-500/70"
                                  : "text-blue-600/70 dark:text-blue-500/70"
                              )}
                            >
                              {formatDate(eventDate)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Stream */}
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none">
              <CardHeader className="p-8 pb-4">
                <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">
                  Activity Log
                </h3>
              </CardHeader>
              <CardContent className="p-8 pt-2">
                {recentActivity.length === 0 ? (
                  <p className="py-10 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase italic">
                    No activity recorded recently
                  </p>
                ) : (
                  <ActivityFeed activities={recentActivity} />
                )}
              </CardContent>
            </Card>

            {/* Team Overview */}
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60 dark:shadow-none">
              <CardHeader className="flex flex-row items-center justify-between p-8 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/30">
                    <Users className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">
                    Team Members
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl font-bold text-blue-600 hover:bg-blue-50"
                  asChild
                >
                  <Link href="/team">View Team</Link>
                </Button>
              </CardHeader>
              <CardContent className="p-8 pt-2">
                <div className="space-y-4">
                  {allBoards.length > 0 && allBoards[0].members ? (
                    allBoards[0].members.slice(0, 5).map((member, index) => (
                      <div key={index} className="group flex items-center gap-4 p-2 pl-0">
                        <div className="relative">
                          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 blur transition duration-500 group-hover:opacity-100" />
                          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white ring-4 ring-white dark:bg-white dark:text-slate-900 dark:ring-slate-900">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black tracking-tight text-slate-900 uppercase dark:text-white">
                            {member.name}
                          </span>
                          <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                            Team Member
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="py-10 text-center text-[10px] font-bold tracking-widest text-slate-400 uppercase italic">
                      No team members found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
