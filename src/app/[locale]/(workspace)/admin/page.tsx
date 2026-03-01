"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock,
  FolderKanban,
  Layers,
  RefreshCw,
  Shield,
  TrendingUp,
  Users
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminStats, useAdminActivity } from "@/hooks/useAdmin"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={cn(
          "absolute inset-0 opacity-5 transition-opacity group-hover:opacity-10",
          color
        )}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">
              {label}
            </p>
            <p className="mt-1 text-4xl font-black text-slate-900 dark:text-white">{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110",
              color
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TaskBar({
  label,
  count,
  total,
  color
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-xs font-black text-slate-900 dark:text-white">
          {count} <span className="font-normal text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  const { stats, loading, error, refresh } = useAdminStats()
  const { activities, loading: actLoading } = useAdminActivity()

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500">
            You need OWNER or ADMIN role to access the Admin Dashboard.
          </p>
          <Link href="/dashboard">
            <Button className="mt-4">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full pb-20">
      {/* Background glows */}
      <div className="pointer-events-none absolute top-20 right-[10%] -z-10 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-20 left-[5%] -z-10 h-[400px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1600px] space-y-10 p-8 lg:p-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-violet-600 to-purple-700 opacity-20 blur transition duration-1000 group-hover:opacity-40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-2xl shadow-violet-500/30">
                <Shield className="h-10 w-10 stroke-[2]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Admin Dashboard
                </h1>
                {stats?.organization && (
                  <Badge className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400">
                    {stats.organization.subscription?.plan ?? "FREE"}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {stats?.organization?.name ?? "Organization"} · Full visibility across your
                workspace
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              className="gap-2 rounded-xl"
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Link href="/admin/users">
              <Button size="sm" className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700">
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/admin/projects">
              <Button size="sm" variant="outline" className="gap-2 rounded-xl">
                <FolderKanban className="h-4 w-4" />
                Projects
              </Button>
            </Link>
          </div>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-slate-200/60 bg-white/40 dark:border-slate-800/60 dark:bg-white/5"
              />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            <StatCard
              label="Team Members"
              value={stats.users}
              icon={Users}
              color="bg-blue-600"
              sub="Active in organization"
            />
            <StatCard
              label="Projects"
              value={stats.projects}
              icon={FolderKanban}
              color="bg-violet-600"
              sub="Active projects"
            />
            <StatCard
              label="Project Boards"
              value={stats.boards}
              icon={Layers}
              color="bg-emerald-600"
              sub="Boards linked to projects"
            />
            <StatCard
              label="Project Tasks"
              value={stats.tasks.total}
              icon={BarChart3}
              color="bg-orange-500"
              sub={`${stats.tasks.completionRate}% completion rate`}
            />
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Task Breakdown */}
          {stats && (
            <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                  <TrendingUp className="h-4 w-4 text-violet-600" />
                  Task Breakdown
                </CardTitle>
                <CardDescription>
                  {stats.tasks.total} project tasks across all projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TaskBar
                  label="To Do"
                  count={stats.tasks.todo}
                  total={stats.tasks.total}
                  color="bg-slate-400"
                />
                <TaskBar
                  label="In Progress"
                  count={stats.tasks.inProgress}
                  total={stats.tasks.total}
                  color="bg-blue-500"
                />
                <TaskBar
                  label="Done"
                  count={stats.tasks.done}
                  total={stats.tasks.total}
                  color="bg-emerald-500"
                />
                <div className="mt-2 rounded-xl bg-violet-50 p-3 text-center dark:bg-violet-900/10">
                  <p className="text-3xl font-black text-violet-700 dark:text-violet-400">
                    {stats.tasks.completionRate}%
                  </p>
                  <p className="text-[10px] font-black tracking-widest text-violet-500 uppercase">
                    Overall Completion
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Projects */}
          {stats && (
            <Card className="border-slate-200/60 shadow-lg lg:col-span-2 dark:border-slate-800/60">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
                    <FolderKanban className="h-4 w-4 text-violet-600" />
                    Recent Projects
                  </CardTitle>
                  <Link href="/admin/projects">
                    <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                      View all →
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats.recentProjects.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-400">No projects yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentProjects.map((proj: any) => (
                      <div
                        key={proj._id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 transition-colors hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow">
                          <FolderKanban className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {proj.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {proj.owner?.name ?? "Unknown owner"} ·{" "}
                            {formatDistanceToNow(new Date(proj.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {proj.isArchived && (
                          <Badge variant="secondary" className="text-[10px]">
                            Archived
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Activity className="h-4 w-4 text-violet-600" />
              Organisation-wide Activity
            </CardTitle>
            <CardDescription>Recent comments and task updates</CardDescription>
          </CardHeader>
          <CardContent>
            {actLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 15).map((act) => (
                  <div
                    key={act._id}
                    className="flex items-start gap-3 rounded-xl px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    {act.user?.avatar ? (
                      <img
                        src={act.user.avatar}
                        alt={act.user.name}
                        className="mt-0.5 h-7 w-7 flex-shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-black text-white">
                        {act.user?.name?.[0] ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-1 text-sm">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {act.user?.name ?? "Unknown"}
                        </span>
                        <span className="text-slate-500">
                          {act.type === "comment" ? "commented on" : "updated"}
                        </span>
                        <span className="font-semibold text-violet-600 dark:text-violet-400">
                          {act.task.title}
                        </span>
                        {act.task.project && (
                          <>
                            <span className="text-slate-400">in</span>
                            <span className="text-slate-600 dark:text-slate-400">
                              {act.task.project?.title}
                            </span>
                          </>
                        )}
                      </div>
                      {act.type === "comment" && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{act.text}</p>
                      )}
                    </div>
                    <div className="ml-2 flex flex-shrink-0 items-center gap-1">
                      {act.type === "comment" ? (
                        <Circle className="h-3 w-3 text-blue-400" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      )}
                      <span className="text-[10px] whitespace-nowrap text-slate-400">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
