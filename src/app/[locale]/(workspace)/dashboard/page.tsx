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

import { ActivityFeed, AvatarGroup, ProgressBar, SegmentedProgress, StatCard, StatusBadge } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useBoards } from "@/hooks/useBoards"
import { useProjectStats } from "@/hooks/useProjectStats"
import { useRecentActivity } from "@/hooks/useRecentActivity"
import { useTaskStats } from "@/hooks/useTaskStats"
import { Link } from "@/i18n/navigation"
import { useTaskStore } from "@/lib/store"
import { formatDate } from "@/lib/utils"

export default function DashboardPage() {
  const userId = useTaskStore((state) => state.userId)
  const { myBoards, teamBoards } = useBoards()
  const taskStats = useTaskStats(userId)
  const projectStats = useProjectStats()
  const recentActivity = useRecentActivity(5)

  const allBoards = [...(myBoards || []), ...(teamBoards || [])]

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your projects.</p>
        </div>
        <Button asChild>
          <Link href="/boards?new=true">
            <Plus className="mr-2 h-4 w-4" />
            New Board
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Tasks"
          value={taskStats.total}
          subtitle={`${taskStats.byStatus.DONE} completed`}
          icon={ListTodo}
          variant="default"
        />
        <StatCard
          title="In Progress"
          value={taskStats.byStatus.IN_PROGRESS}
          subtitle="Active tasks"
          icon={Clock}
          variant="primary"
        />
        <StatCard
          title="Completed"
          value={taskStats.byStatus.DONE}
          subtitle={`${taskStats.completionRate}% completion rate`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          title="Overdue"
          value={taskStats.overdue}
          subtitle="Need attention"
          icon={AlertCircle}
          variant={taskStats.overdue > 0 ? "danger" : "default"}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Overview
              </CardTitle>
              <CardDescription>Task distribution across all projects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SegmentedProgress
                segments={[
                  { value: taskStats.byStatus.DONE, color: "bg-green-500", label: "Done" },
                  { value: taskStats.byStatus.IN_PROGRESS, color: "bg-blue-500", label: "In Progress" },
                  { value: taskStats.byStatus.TODO, color: "bg-slate-300", label: "To Do" }
                ]}
                total={taskStats.total || 1}
                size="lg"
                showLegend
              />
            </CardContent>
          </Card>

          {/* Projects List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Your Projects
                </CardTitle>
                <CardDescription>{projectStats.totalProjects} projects total</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/boards">
                  View all
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {projectStats.projectsWithProgress.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <FolderKanban className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2">No projects yet</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/boards?new=true">Create your first board</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {projectStats.projectsWithProgress.slice(0, 5).map(({ project, progress, taskCount }) => (
                    <div key={project._id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{project.title}</span>
                          <StatusBadge type="custom" value={`${taskCount} tasks`} size="sm" showDot={false} />
                        </div>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <ProgressBar value={progress} size="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Boards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Boards</CardTitle>
                <CardDescription>Boards you own</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/boards?new=true">
                  <Plus className="mr-2 h-4 w-4" />
                  New Board
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {allBoards.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground">No boards yet</div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {allBoards.slice(0, 4).map((board) => (
                    <Link
                      key={board._id}
                      href={`/boards/${board._id}`}
                      className="group rounded-lg border p-4 transition-all hover:border-primary hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium group-hover:text-primary">{board.title}</h4>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {board.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <FolderKanban className="h-3 w-3" />
                          {board.projects?.length || 0} projects
                        </div>
                        {board.members && board.members.length > 0 && (
                          <AvatarGroup
                            users={board.members.map((m) => ({ name: m.name }))}
                            max={3}
                            size="xs"
                          />
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due Today</span>
                <span className="font-medium">{taskStats.dueToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due This Week</span>
                <span className="font-medium">{taskStats.dueSoon}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Assigned to Me</span>
                <span className="font-medium">{taskStats.assignedToMe}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Boards</span>
                <span className="font-medium">{allBoards.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" />
                Upcoming
              </CardTitle>
            </CardHeader>
            <CardContent>
              {taskStats.dueSoon === 0 && taskStats.dueToday === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No upcoming deadlines</p>
              ) : (
                <div className="space-y-3">
                  {taskStats.dueToday > 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-3 dark:bg-orange-950">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium">Due Today</p>
                        <p className="text-xs text-muted-foreground">{taskStats.dueToday} tasks</p>
                      </div>
                    </div>
                  )}
                  {taskStats.overdue > 0 && (
                    <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-medium">Overdue</p>
                        <p className="text-xs text-muted-foreground">{taskStats.overdue} tasks need attention</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No recent activity</p>
              ) : (
                <ActivityFeed activities={recentActivity} />
              )}
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Team
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/team">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allBoards.length > 0 && allBoards[0].members ? (
                  allBoards[0].members.slice(0, 5).map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {member.name.charAt(0)}
                      </div>
                      <span className="text-sm">{member.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">No team members</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
