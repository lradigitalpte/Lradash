"use client"

import { AlertCircle, BarChart3, Clock, RefreshCw, TrendingUp, Zap } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useVelocityAnalytics } from "@/hooks/useAnalytics"
import { cn } from "@/lib/utils"

const BOARD_COLORS = [
  "#6366f1",
  "#10b981",
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16"
]

export default function VelocityAnalyticsPage() {
  const { data, loading, error, refresh } = useVelocityAnalytics()

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm text-slate-500">Failed to load velocity analytics.</p>
          <Button size="sm" onClick={refresh} className="mt-3">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const lt = data?.leadTime
  const totalVelo = data?.boardVelocity.reduce((s, b) => s + b.totalCompleted, 0) ?? 0

  return (
    <div className="space-y-8 pb-12">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          {
            label: "Avg Lead Time",
            value: loading ? "—" : `${lt?.avg ?? 0}d`,
            icon: Clock,
            color: "bg-indigo-600",
            sub: "creation → done"
          },
          {
            label: "Fastest",
            value: loading ? "—" : `${lt?.min ?? 0}d`,
            icon: Zap,
            color: "bg-emerald-600",
            sub: "minimum lead time"
          },
          {
            label: "Slowest",
            value: loading ? "—" : `${lt?.max ?? 0}d`,
            icon: TrendingUp,
            color: (lt?.max ?? 0 > 14) ? "bg-red-500" : "bg-orange-500",
            sub: "maximum lead time"
          },
          {
            label: "Completed",
            value: loading ? "—" : (lt?.totalCompleted ?? 0),
            icon: BarChart3,
            color: "bg-violet-600",
            sub: "tasks done (8 weeks)"
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

      {/* Weekly Throughput */}
      <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            Weekly Throughput
          </CardTitle>
          <CardDescription>Tasks completed per week over the last 8 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={data?.weeklyThroughput ?? []}
                margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
              >
                <defs>
                  <linearGradient id="gradVelo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number | undefined) => [v ?? 0, "Tasks Completed"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    fontSize: 12
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradVelo)"
                  dot={{ fill: "#6366f1", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead time distribution */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Clock className="h-4 w-4 text-indigo-600" />
              Lead Time Distribution
            </CardTitle>
            <CardDescription>How long tasks take from creation to Done</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : (data?.leadTimeDist.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No completed tasks yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data?.leadTimeDist ?? []}
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(v: number | undefined) => [v ?? 0, "Tasks"]}
                    contentStyle={{ borderRadius: "12px", fontSize: 12 }}
                  />
                  <Bar dataKey="count" name="Tasks" radius={[6, 6, 0, 0]}>
                    {(data?.leadTimeDist ?? []).map((_, i) => (
                      <Cell key={i} fill={BOARD_COLORS[i % BOARD_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Board velocity comparison */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Zap className="h-4 w-4 text-indigo-600" />
              Board Velocity
            </CardTitle>
            <CardDescription>Total completed tasks per board (8 weeks)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-56 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
            ) : (data?.boardVelocity.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                No project boards with completed tasks
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={
                    data?.boardVelocity.map((b, i) => ({
                      name: b.title.length > 12 ? b.title.slice(0, 10) + "…" : b.title,
                      completed: b.totalCompleted,
                      avgPerWeek: b.avgPerWeek,
                      color: BOARD_COLORS[i % BOARD_COLORS.length]
                    })) ?? []
                  }
                  margin={{ top: 5, right: 10, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: "12px", fontSize: 12 }} />
                  <Bar dataKey="completed" name="Completed" radius={[6, 6, 0, 0]}>
                    {(data?.boardVelocity ?? []).map((_, i) => (
                      <Cell key={i} fill={BOARD_COLORS[i % BOARD_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Board velocity detail */}
      {!loading && (data?.boardVelocity.length ?? 0) > 0 && (
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Board Velocity Breakdown
            </CardTitle>
            <CardDescription>Average tasks completed per week per board</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.boardVelocity.map((b, i) => (
                <div
                  key={b.boardId}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-full"
                    style={{ background: BOARD_COLORS[i % BOARD_COLORS.length] }}
                  />
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                    {b.title}
                  </p>
                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-center">
                      <p className="font-black text-slate-900 dark:text-white">
                        {b.totalCompleted}
                      </p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Total Done
                      </p>
                    </div>
                    <div className="text-center">
                      <p
                        className="font-black"
                        style={{ color: BOARD_COLORS[i % BOARD_COLORS.length] }}
                      >
                        {b.avgPerWeek}
                      </p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Avg/Week
                      </p>
                    </div>
                    <Badge
                      className="border-0 text-[10px] font-black"
                      style={{
                        background: BOARD_COLORS[i % BOARD_COLORS.length] + "20",
                        color: BOARD_COLORS[i % BOARD_COLORS.length]
                      }}
                    >
                      {b.avgPerWeek} tasks/wk
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-2xl bg-indigo-50 px-5 py-3 dark:bg-indigo-900/10">
                <p className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                  Org Total Velocity
                </p>
                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">
                  {totalVelo} tasks
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
