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
  Info,
  ArrowRight
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

export default function BoardDashboardPage() {
  const params = useParams()
  const boardId = params?.boardId as string
  const locale = params?.locale as string
  const [board, setBoard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (boardId) {
      fetchBoard()
    }
  }, [boardId])

  const fetchBoard = async () => {
    try {
      setLoading(true)
      const [boardRes, tasksRes] = await Promise.all([
        apiClient.get(`/api/boards/${boardId}`),
        apiClient.get(`/api/boards/${boardId}/tasks`)
      ])
      if (!boardRes.ok) {
        setError("Board not found")
        setLoading(false)
        return
      }
      const boardData = await boardRes.json()
      const tasksData = tasksRes.ok ? await tasksRes.json() : []
      setBoard({ ...boardData, tasks: Array.isArray(tasksData) ? tasksData : [] })
    } catch (err) {
      setError("Failed to load board")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const boardTasks = useMemo(() => board?.tasks || [], [board])
  const totalTasks = boardTasks.length
  const todoTasks = boardTasks.filter((t: any) => t.status === "TODO").length
  const inProgressTasks = boardTasks.filter(
    (t: any) => t.status === "IN_PROGRESS" || t.status === "DOING"
  ).length
  const doneTasks = boardTasks.filter((t: any) => t.status === "DONE").length
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  // Get recent tasks (last 5 tasks sorted by updated date)
  const recentTasks = useMemo(() => {
    return [...boardTasks]
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  }, [boardTasks])

  if (loading) {
    return (
      <div className="flex min-h-[600px] flex-col items-center justify-center space-y-4">
        <div className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-blue-600/10">
          <Zap className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
          Loading Board...
        </p>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="flex min-h-[600px] items-center justify-center p-8">
        <Card className="w-full max-w-md rounded-[2rem] border-none bg-white p-8 text-center shadow-2xl dark:bg-slate-900">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20">
            <Shield className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="mb-2 text-2xl font-black">{error || "Access Denied"}</h2>
          <p className="mb-8 font-medium text-slate-500 italic">
            The requested board details could not be found.
          </p>
          <Link href={`/${locale}/boards`}>
            <Button className="h-12 w-full rounded-xl bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900">
              Return to Boards
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-full space-y-10 bg-slate-50/30 p-8 pb-32 font-sans dark:bg-slate-950/30">
      {/* 1. Board Header */}
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 transform items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20 transition-all duration-500 hover:rotate-6">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <Badge
                variant="outline"
                className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
              >
                Board Dashboard
              </Badge>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400">
                <Clock className="h-3 w-3" />
                CREATED: {new Date(board.createdAt).toLocaleDateString()}
                <span className="mx-1">•</span>
                <Activity className="h-3 w-3" />
                UPDATED: {new Date(board.updatedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <h1 className="text-5xl leading-tight font-black tracking-tighter text-slate-900 dark:text-white">
            {board.title}
          </h1>
          <p className="max-w-3xl text-lg leading-relaxed font-medium text-slate-500 italic">
            {board.description || "Personal board workspace for organized project tracking."}
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
          <Link href={`/${locale}/boards/${boardId}/board`}>
            <Button className="group h-14 gap-2 rounded-2xl bg-indigo-600 px-8 font-black text-white shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 hover:bg-indigo-700">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              New Task
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Board Stats */}
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
                  <CardTitle className="text-2xl font-black">Board Progress</CardTitle>
                  <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Total progress overview
                  </CardDescription>
                </div>
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-10 p-10 pt-6">
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div className="space-y-0.5">
                    <span className="text-3xl leading-none font-black text-indigo-600">
                      {completionRate}%
                    </span>
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Completed
                    </p>
                  </div>
                </div>
                <div className="h-6 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-1.5 shadow-inner dark:border-slate-800 dark:bg-slate-950">
                  <div
                    className="group relative h-full rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 transition-all duration-1000"
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
                    color: "bg-indigo-500",
                    sub: "Currently active"
                  },
                  { label: "Done", val: doneTasks, color: "bg-emerald-500", sub: "Tasks completed" }
                ].map((phase, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", phase.color)} />
                      <span className="text-[10px] font-black tracking-widest text-slate-900 uppercase dark:text-white">
                        {phase.label}
                      </span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                      {phase.val}
                    </div>
                    <p className="text-[9px] font-bold tracking-tighter text-slate-400 uppercase">
                      {phase.sub}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Board AI Insights */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none bg-slate-900 p-8 text-white shadow-2xl dark:bg-indigo-600">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <h4 className="mb-4 text-xl font-black tracking-tight uppercase">AI Board Insights</h4>
            <div className="space-y-6">
              <p className="text-sm leading-relaxed font-medium text-blue-100 italic">
                Board analysis indicates steady progression. All milestones within the progress
                phase will be completed on schedule.
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-blue-200 uppercase">
                  <span>Overall Health</span>
                  <span>85%</span>
                </div>
                <div className="h-1 rounded-full bg-white/10">
                  <div className="h-full w-[85%] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
              <Button className="h-12 w-full rounded-xl bg-white font-black tracking-widest text-slate-900 uppercase transition-all hover:bg-blue-50">
                Generate Full Report
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
