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
  UserAvatar
} from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBoards } from "@/hooks/useBoards"
import { useProjectStats } from "@/hooks/useProjectStats"
import { useRecentActivity } from "@/hooks/useRecentActivity"
import { useTaskStats } from "@/hooks/useTaskStats"
import { useWorkspaceActivity } from "@/hooks/useWorkspaceActivity"
import { Link } from "@/i18n/navigation"
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"
import { cn, formatDate } from "@/lib/utils"

export default function DashboardPage() {
  const userId = useTaskStore((state) => state.userId)
  const { myBoards, teamBoards } = useBoards()
  const taskStats = useTaskStats(userId)
  const projectStats = useProjectStats()
  const recentActivity = useRecentActivity(5)
  const workspaceActivity = useWorkspaceActivity(5)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [activityView, setActivityView] = useState<"personal" | "workspace">("personal")

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
  const teamMembers = Array.from(
    new Map(
      allBoards
        .flatMap((board) => board.members || [])
        .filter((member) => member?.id)
        .map((member) => [member.id, member])
    ).values()
  )

  return (
    <div className="relative min-h-full pb-12">
      <div className="mx-auto max-w-[1400px] space-y-8 p-5 lg:p-8">
        <div className="flex flex-col justify-between gap-6 pt-1 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md ring-1 shadow-blue-500/25 ring-blue-400/35 dark:shadow-blue-500/20">
              <TrendingUp className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Overview</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl dark:text-white">
                Dashboard
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground">
                Task and project metrics across your workspace.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              className="gap-2 bg-blue-600 text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
              asChild
            >
              <Link href="/boards?new=true">
                <Plus className="size-4" />
                New board
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total tasks"
            value={taskStats.total}
            subtitle={`${taskStats.byStatus.DONE} completed`}
            icon={ListTodo}
            variant="default"
          />
          <StatCard
            title="In progress"
            value={taskStats.byStatus.IN_PROGRESS}
            subtitle="Active work items"
            icon={Clock}
            variant="primary"
          />
          <StatCard
            title="Completed"
            value={taskStats.byStatus.DONE}
            subtitle={`${taskStats.completionRate}% of total`}
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Overdue"
            value={taskStats.overdue}
            subtitle={taskStats.overdue > 0 ? "Requires attention" : "None overdue"}
            icon={AlertCircle}
            variant={taskStats.overdue > 0 ? "danger" : "default"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Project Overview */}
          <div className="space-y-6">
            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-md bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                    <TrendingUp className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Task distribution</CardTitle>
                    <CardDescription className="text-xs">By status</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
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
                  size="md"
                  showLegend
                />
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted text-foreground dark:bg-slate-800/80">
                    <FolderKanban className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">Projects</CardTitle>
                    <CardDescription className="text-xs">
                      {projectStats.totalProjects} active
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                  <Link href="/boards">
                    View all
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {(() => {
                  // Filter projects to only show those where current user is a member
                  const userProjectsWithProgress = projectStats.projectsWithProgress.filter(
                    ({ project }) =>
                      project.members &&
                      project.members.some(
                        (member) => String(member.id ?? "") === String(userId ?? "")
                      )
                  )

                  return userProjectsWithProgress.length === 0 ? (
                    <div className="space-y-4 py-12 text-center">
                      <div className="mx-auto flex size-12 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                        <FolderKanban className="size-6 opacity-50" />
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-medium text-foreground">
                          No projects yet
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Join or create a project to see it here.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/boards?new=true">Create project</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3 lg:grid-cols-2">
                      {userProjectsWithProgress
                        .slice(0, 6)
                        .map(({ project, progress, taskCount }) => (
                          <Link
                            key={project._id}
                            href={`/projects/${project._id}`}
                            className="block rounded-lg border border-slate-200/90 bg-slate-50/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md dark:border-slate-800/90 dark:bg-slate-900/40 dark:hover:border-blue-900/40 dark:hover:bg-blue-950/20"
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                                    {project.title.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="flex min-w-0 flex-col">
                                    <span className="truncate text-sm font-medium text-foreground">
                                      {project.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {taskCount} tasks
                                    </span>
                                  </div>
                                </div>
                                <div className="shrink-0 rounded-md bg-muted/80 px-2 py-1">
                                  <span className="text-xs font-medium text-foreground tabular-nums">
                                    {progress}%
                                  </span>
                                </div>
                              </div>
                              <ProgressBar value={progress} size="sm" className="bg-muted" />
                            </div>
                          </Link>
                        ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle className="text-base font-semibold">Boards</CardTitle>
                  <CardDescription className="text-xs">Workspaces you use</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1" asChild>
                  <Link href="/boards?new=true">
                    <Plus className="size-3.5" />
                    New
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {allBoards.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No boards yet. Create a board to organize projects.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {allBoards.slice(0, 4).map((board) => (
                      <Link
                        key={board._id}
                        href={`/boards/${board._id}`}
                        className="rounded-lg border border-slate-200/90 bg-white/80 p-4 transition-colors hover:bg-slate-50/90 dark:border-slate-800/90 dark:bg-slate-900/30 dark:hover:bg-slate-800/50"
                      >
                        <div className="flex h-full flex-col gap-3">
                          <div className="space-y-1">
                            <h4 className="text-sm font-medium text-foreground">{board.title}</h4>
                            <p className="line-clamp-2 text-xs text-muted-foreground">
                              {board.description || "No description"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <FolderKanban className="size-3.5" />
                              {board.projectId ? 1 : 0} projects
                            </div>
                            {board.members && board.members.length > 0 && (
                              <AvatarGroup
                                users={board.members.map((m) => ({ name: m.name, image: m.image }))}
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

          <div className="space-y-6">
            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                {[
                  { label: "Due today", value: taskStats.dueToday, color: "text-rose-600" },
                  { label: "Due soon", value: taskStats.dueSoon, color: "text-amber-600" },
                  {
                    label: "Assigned to me",
                    value: taskStats.assignedToMe,
                    color: "text-blue-600"
                  },
                  { label: "Boards", value: allBoards.length, sub: "Boards" }
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                    <span
                      className={cn(
                        "text-lg font-semibold text-foreground tabular-nums",
                        stat.color
                      )}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-blue-600/80 dark:text-blue-400/90" />
                  <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {upcomingEvents.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No upcoming events
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event: any) => {
                      const eventDate = new Date(event.startTime)
                      const isToday = eventDate.toDateString() === new Date().toDateString()
                      return (
                        <div
                          key={event._id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg border border-border p-3",
                            isToday
                              ? "border border-rose-200/90 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/25"
                              : "border border-blue-200/80 bg-blue-50/50 dark:border-blue-900/40 dark:bg-blue-950/30"
                          )}
                        >
                          <AlertCircle
                            className={cn("h-5 w-5", isToday ? "text-rose-500" : "text-blue-500")}
                          />
                          <div>
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isToday
                                  ? "text-rose-900 dark:text-rose-400"
                                  : "text-blue-900 dark:text-blue-400"
                              )}
                            >
                              {event.title}
                            </p>
                            <p
                              className={cn(
                                "text-xs text-muted-foreground",
                                isToday ? "text-rose-700/80" : "text-blue-700/80"
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

            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Recent activity</CardTitle>
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
                    <button
                      onClick={() => {
                        setActivityView("personal")
                      }}
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium transition-colors",
                        activityView === "personal"
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                      )}
                    >
                      My Activity
                    </button>
                    <button
                      onClick={() => {
                        setActivityView("workspace")
                      }}
                      className={cn(
                        "rounded px-2 py-1 text-xs font-medium transition-colors",
                        activityView === "workspace"
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300"
                      )}
                    >
                      Team Activity
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {(activityView === "personal" ? recentActivity : workspaceActivity).length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No recent activity
                  </p>
                ) : (
                  <ActivityFeed
                    activities={activityView === "personal" ? recentActivity : workspaceActivity}
                  />
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800/90 dark:bg-slate-950/35">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-slate-500 dark:text-slate-400" />
                  <CardTitle className="text-sm font-medium">Team</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                  <Link href="/team">View</Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {teamMembers.length > 0 ? (
                    teamMembers.slice(0, 5).map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <UserAvatar name={member.name} image={member.image} size="sm" />
                        <span className="text-sm font-medium text-foreground">{member.name}</span>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No members on this board
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
