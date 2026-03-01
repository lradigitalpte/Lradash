"use client"

import { AlertCircle, CheckCircle2, MessageSquare, RefreshCw, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTeamAnalytics } from "@/hooks/useAnalytics"
import { cn } from "@/lib/utils"

// Palette: cycle through these for member bars
const MEMBER_COLORS = [
  "#6366f1",
  "#10b981",
  "#f97316",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16"
]

export default function TeamAnalyticsPage() {
  const { data, loading, error, refresh } = useTeamAnalytics()

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-400" />
          <p className="text-sm text-slate-500">Failed to load team analytics.</p>
          <Button size="sm" onClick={refresh} className="mt-3">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const members = data?.members ?? []
  const totalAssigned = members.reduce((s, m) => s + m.assigned, 0)

  // Build workload bar data
  const workloadData = members.map((m, i) => ({
    name: m.name.split(" ")[0],
    todo: m.todo,
    inProgress: m.inProgress,
    done: m.done,
    color: MEMBER_COLORS[i % MEMBER_COLORS.length]
  }))

  // Build completion rate bar data
  const completionData = members
    .filter((m) => m.assigned > 0)
    .map((m, i) => ({
      name: m.name.split(" ")[0],
      rate: m.completionRate,
      color: MEMBER_COLORS[i % MEMBER_COLORS.length]
    }))

  return (
    <div className="space-y-8 pb-12">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {[
          {
            label: "Team Members",
            value: loading ? "—" : members.length,
            icon: Users,
            color: "bg-indigo-600"
          },
          {
            label: "Total Assigned",
            value: loading ? "—" : totalAssigned,
            icon: CheckCircle2,
            color: "bg-emerald-600",
            sub: "across all members"
          },
          {
            label: "Avg Completion",
            value: loading
              ? "—"
              : `${members.length > 0 ? Math.round(members.reduce((s, m) => s + m.completionRate, 0) / members.length) : 0}%`,
            icon: CheckCircle2,
            color: "bg-violet-600",
            sub: "average task completion"
          },
          {
            label: "Total Comments",
            value: loading ? "—" : members.reduce((s, m) => s + m.commentCount, 0),
            icon: MessageSquare,
            color: "bg-blue-600",
            sub: "across all tasks"
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
                  {s.sub && <p className="mt-0.5 text-xs text-slate-500">{s.sub}</p>}
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

      {/* Workload stacked bar */}
      <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
            <Users className="h-4 w-4 text-indigo-600" />
            Team Workload
          </CardTitle>
          <CardDescription>Task distribution by status per team member</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-72 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ) : members.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              No team members with assigned tasks
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={workloadData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
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
                <Bar dataKey="todo" name="To Do" stackId="a" fill="#94a3b8" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#6366f1" />
                <Bar dataKey="done" name="Done" stackId="a" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Completion rate comparison */}
      <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            Completion Rate per Member
          </CardTitle>
          <CardDescription>% of assigned tasks marked as Done</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-60 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ) : completionData.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={completionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v: number | undefined) => [`${v ?? 0}%`, "Completion Rate"]}
                  contentStyle={{ borderRadius: "12px", fontSize: 12 }}
                />
                <Bar dataKey="rate" name="Completion %" radius={[8, 8, 0, 0]}>
                  {completionData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.rate >= 80 ? "#10b981" : entry.rate >= 40 ? "#6366f1" : "#f97316"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Member cards leaderboard */}
      {!loading && members.length > 0 && (
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Users className="h-4 w-4 text-indigo-600" />
              Member Leaderboard
            </CardTitle>
            <CardDescription>Ranked by tasks assigned</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((m, i) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-3 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {i + 1}
                  </div>
                  {m.avatar ? (
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                      style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}
                    >
                      {m.name[0].toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</p>
                    <p className="text-xs text-slate-400">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs">
                    <div className="text-center">
                      <p className="font-black text-slate-900 dark:text-white">{m.assigned}</p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Assigned
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-emerald-600">{m.done}</p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Done
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="font-black text-blue-600">{m.commentCount}</p>
                      <p className="text-[9px] font-black tracking-wider text-slate-400 uppercase">
                        Comments
                      </p>
                    </div>
                    <div className="min-w-[60px] text-center">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            m.completionRate >= 80
                              ? "bg-emerald-500"
                              : m.completionRate >= 40
                                ? "bg-indigo-500"
                                : "bg-orange-500"
                          )}
                          style={{ width: `${m.completionRate}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[10px] font-black text-slate-500">
                        {m.completionRate}%
                      </p>
                    </div>
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
