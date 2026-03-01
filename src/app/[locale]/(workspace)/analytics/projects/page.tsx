"use client"

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  FolderKanban,
  RefreshCw,
  TrendingUp
} from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useProjectAnalytics } from "@/hooks/useAnalytics"
import { cn } from "@/lib/utils"

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#94a3b8",
  MEDIUM: "#3b82f6",
  HIGH: "#f97316",
  URGENT: "#ef4444"
}

const PRIORITY_BG: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700"
}

export default function ProjectAnalyticsPage() {
  const { data, loading, error, refresh } = useProjectAnalytics()

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm text-slate-500">Failed to load analytics. Try refreshing.</p>
          <Button size="sm" onClick={refresh} className="mt-3">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const totalTasks = data?.projectStats.reduce((s, p) => s + p.total, 0) ?? 0
  const doneTasks = data?.projectStats.reduce((s, p) => s + p.done, 0) ?? 0
  const overallRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-8 pb-12">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          {
            label: "Total Tasks",
            value: loading ? "—" : totalTasks,
            icon: BarChart3,
            color: "bg-indigo-600",
            sub: "across all projects"
          },
          {
            label: "Completed",
            value: loading ? "—" : doneTasks,
            icon: CheckCircle2,
            color: "bg-emerald-600",
            sub: `${overallRate}% completion rate`
          },
          {
            label: "Overdue",
            value: loading ? "—" : (data?.overdueCount ?? 0),
            icon: AlertCircle,
            color: (data?.overdueCount ?? 0) > 0 ? "bg-red-500" : "bg-slate-400",
            sub: "past due date, not done"
          },
          {
            label: "Active Projects",
            value: loading ? "—" : (data?.projectStats.length ?? 0),
            icon: FolderKanban,
            color: "bg-violet-600",
            sub: "with tasks"
          }
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {s.label}
                  </p>
                  <p className="mt-1 text-4xl font-black text-slate-900 dark:text-white">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.sub}</p>
                </div>
                <div
                  className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", s.color)}
                >
                  <s.icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Weekly Trend Chart */}
      <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            Weekly Task Trend
          </CardTitle>
          <CardDescription>Tasks created vs completed over the last 8 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={data?.weeklyTrend ?? []}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    fontSize: 12
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#gradCreated)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priority Breakdown */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Priority Breakdown
            </CardTitle>
            <CardDescription>Distribution of tasks by priority</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={data?.priorityBreakdown ?? []}
                      dataKey="count"
                      nameKey="priority"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {(data?.priorityBreakdown ?? []).map((entry) => (
                        <Cell
                          key={entry.priority}
                          fill={PRIORITY_COLORS[entry.priority] ?? "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {(data?.priorityBreakdown ?? []).map((p) => (
                    <div key={p.priority} className="flex items-center justify-between">
                      <Badge
                        className={cn(
                          "border-0 text-[10px] font-black",
                          PRIORITY_BG[p.priority] ?? "bg-slate-100"
                        )}
                      >
                        {p.priority}
                      </Badge>
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {p.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-project completion */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <FolderKanban className="h-4 w-4 text-indigo-600" />
              Project Completion
            </CardTitle>
            <CardDescription>Task completion rate per project</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : (data?.projectStats.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No projects with tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data?.projectStats.slice(0, 6) ?? []}
                  margin={{ top: 5, right: 10, bottom: 30, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="title"
                    tick={{ fontSize: 10, fontWeight: 700 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    formatter={(v: number | undefined) => [`${v ?? 0}%`, "Completion"]}
                    contentStyle={{ borderRadius: "12px", fontSize: 12 }}
                  />
                  <Bar dataKey="completionRate" name="Completion %" radius={[6, 6, 0, 0]}>
                    {(data?.projectStats.slice(0, 6) ?? []).map((entry) => (
                      <Cell
                        key={entry._id}
                        fill={
                          entry.completionRate >= 80
                            ? "#10b981"
                            : entry.completionRate >= 40
                              ? "#6366f1"
                              : "#f97316"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project detail table */}
      {!loading && (data?.projectStats.length ?? 0) > 0 && (
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Clock className="h-4 w-4 text-indigo-600" />
              Project Detail
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.projectStats.map((p) => (
                <div
                  key={p._id}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow">
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {p.title}
                    </p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          p.completionRate >= 80
                            ? "bg-emerald-500"
                            : p.completionRate >= 40
                              ? "bg-indigo-500"
                              : "bg-orange-500"
                        )}
                        style={{ width: `${p.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center">
                      <p className="font-black text-slate-900 dark:text-white">{p.total}</p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Total
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-emerald-600">{p.done}</p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Done
                      </p>
                    </div>
                    {p.overdue > 0 && (
                      <div className="text-center">
                        <p className="font-black text-red-500">{p.overdue}</p>
                        <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                          Overdue
                        </p>
                      </div>
                    )}
                    <Badge
                      className={cn(
                        "border-0 text-[10px] font-black",
                        p.completionRate >= 80
                          ? "bg-emerald-100 text-emerald-700"
                          : p.completionRate >= 40
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-orange-100 text-orange-700"
                      )}
                    >
                      {p.completionRate}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
