"use client"

import { useEffect, useState } from "react"

import { apiClient } from "@/lib/api/client"

// ── Project Analytics ────────────────────────────────────────────────────────
export interface WeeklyPoint {
  week: string
  label: string
  created: number
  completed: number
}
export interface PriorityPoint {
  priority: string
  count: number
}
export interface ProjectStat {
  _id: string
  title: string
  total: number
  done: number
  overdue: number
  completionRate: number
}
export interface ProjectAnalytics {
  weeklyTrend: WeeklyPoint[]
  priorityBreakdown: PriorityPoint[]
  overdueCount: number
  projectStats: ProjectStat[]
}

// ── Team Analytics ───────────────────────────────────────────────────────────
export interface MemberStat {
  userId: string
  name: string
  email: string
  avatar?: string
  assigned: number
  done: number
  inProgress: number
  todo: number
  created: number
  commentCount: number
  completionRate: number
}
export interface TeamAnalytics {
  members: MemberStat[]
  weeklyContrib: { week: string; userId: string; count: number }[]
}

// ── Velocity Analytics ───────────────────────────────────────────────────────
export interface ThroughputPoint {
  week: string
  label: string
  completed: number
}
export interface LeadTimeStats {
  avg: number
  min: number
  max: number
  totalCompleted: number
}
export interface LeadTimeBucket {
  range: string
  count: number
}
export interface BoardVelocity {
  boardId: string
  title: string
  totalCompleted: number
  avgPerWeek: number
  weekly: { week: string; count: number }[]
}
export interface VelocityAnalytics {
  weeklyThroughput: ThroughputPoint[]
  leadTime: LeadTimeStats
  leadTimeDist: LeadTimeBucket[]
  boardVelocity: BoardVelocity[]
}

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    setLoading(true)
    apiClient
      .get(url)
      .then( async (r) => {
        if (!r.ok) {throw new Error("Failed to fetch")}
        return r.json()
      })
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((e) =>{  setError(e.message); })
      .finally(() =>{  setLoading(false); })
  }

  useEffect(() => {
    refresh()
  }, [])

  return { data, loading, error, refresh }
}

export function useProjectAnalytics() {
  return useFetch<ProjectAnalytics>("/api/analytics/projects")
}

export function useTeamAnalytics() {
  return useFetch<TeamAnalytics>("/api/analytics/team")
}

export function useVelocityAnalytics() {
  return useFetch<VelocityAnalytics>("/api/analytics/velocity")
}
