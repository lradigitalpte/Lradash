"use client"

import {
  Activity,
  Globe,
  Mail,
  ShieldCheck,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"

import { apiClient } from "@/lib/api/client"
import { IMonitor, MonitorStatus } from "@/types/monitor"

export default function MonitorPage() {
  const [monitors, setMonitors] = useState<IMonitor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMonitors = async () => {
      try {
        const response = await apiClient.get("/api/monitor")
        if (response.ok) {
          const data = await response.json()
          setMonitors(data)
        }
      } catch (error) {
        console.error("Dashboard fetch failed:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMonitors()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  const activeCount = monitors.length
  const downCount = monitors.filter((m) => m.status === MonitorStatus.DOWN).length
  const avgUptime = activeCount > 0 ? "99.9%" : "---"

  // Calculate monthly cost from subscriptions
  const subscriptions = monitors.filter((m) => m.type === "SUBSCRIPTION")
  const monthlyCost = subscriptions
    .filter((m) => m.metadata?.billingCycle === "MONTHLY" || !m.metadata?.billingCycle)
    .reduce((acc, m) => acc + (m.price || 0), 0)

  // Get upcoming renewals (SSL, DOMAIN, SUBSCRIPTION) sorted by expiry date
  const getUpcomingRenewals = () => {
    const renewals = monitors
      .filter(
        (m) =>
          (m.type === "SSL" || m.type === "DOMAIN" || m.type === "SUBSCRIPTION") && m.expiryDate
      )
      .map((m) => ({
        ...m,
        daysUntilExpiry: Math.ceil(
          (new Date(m.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
      }))
      .filter((m) => m.daysUntilExpiry > 0) // Only future renewals
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 3) // Get top 3 upcoming

    return renewals
  }

  const upcomingRenewals = getUpcomingRenewals()

  // Get next renewal date for the stat
  const nextRenewalDays = upcomingRenewals.length > 0 ? upcomingRenewals[0].daysUntilExpiry : 0

  return (
    <div className="space-y-10">
      {/* Mega Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-12 text-white shadow-2xl">
        <div className="relative z-10">
          <span className="mb-2 inline-block text-[10px] font-black tracking-[0.3em] text-red-400 uppercase">
            Live Status
          </span>
          <h1 className="text-5xl font-black tracking-tighter">
            Infrastructure <span className="text-red-500">Overview</span>
          </h1>
          <p className="mt-4 max-w-xl font-medium text-slate-400 italic">
            Real-time monitoring of your digital ecosystem. Track uptime, server health, and
            critical subscription renewals in one place.
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-red-600/20 blur-[100px]" />
        <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Uptime"
          value={avgUptime}
          change="+0.02%"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Active Monitors"
          value={activeCount.toString()}
          description="Total tracked assets"
          icon={Globe}
          color="blue"
        />
        <StatCard
          title="Alerts Pending"
          value={downCount.toString()}
          description={downCount > 0 ? "Issues detected" : "System healthy"}
          icon={downCount > 0 ? AlertCircle : CheckCircle2}
          color={downCount > 0 ? "red" : "emerald"}
        />
        <StatCard
          title="Monthly Cost"
          value={`$${monthlyCost.toLocaleString()}`}
          change={nextRenewalDays > 0 ? `Due in ${nextRenewalDays} days` : "No renewals pending"}
          icon={CreditCard}
          color="amber"
        />
      </div>

      {/* Main Content Sections */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Incidents */}
        <div className="group rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl transition-all hover:shadow-2xl lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
            <Activity className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-6">
            {monitors.slice(0, 5).map((monitor) => (
              <ActivityItem
                key={monitor._id}
                status={monitor.status}
                name={monitor.name}
                time={
                  monitor.lastChecked
                    ? new Date(monitor.lastChecked).toLocaleTimeString()
                    : "Pending"
                }
                details={monitor.type === "WEBSITE" ? monitor.target : `${monitor.type} Check`}
              />
            ))}
            {monitors.length === 0 && (
              <p className="py-10 text-center font-medium text-slate-400 italic">
                No activity recorded yet...
              </p>
            )}
          </div>
        </div>

        {/* Coming Up (SSL/Domains/Subs) */}
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-8 text-2xl font-black tracking-tight">Upcoming Renewals</h2>
          <div className="space-y-6">
            {upcomingRenewals.length > 0 ? (
              upcomingRenewals.map((renewal, idx) => {
                const typeColors: any = {
                  SSL: "red",
                  DOMAIN: "blue",
                  SUBSCRIPTION: "amber"
                }
                const typeLabel: any = {
                  SSL: "SSL",
                  DOMAIN: "DOMAIN",
                  SUBSCRIPTION: "SUB"
                }
                return (
                  <RenewalItem
                    key={idx}
                    type={typeLabel[renewal.type]}
                    name={renewal.name}
                    days={renewal.daysUntilExpiry}
                    color={typeColors[renewal.type]}
                  />
                )
              })
            ) : (
              <p className="py-10 text-center font-medium text-slate-400 italic">
                No upcoming renewals
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, description, icon: Icon, color }: any) {
  const colorMap: any = {
    red: "bg-red-500 text-red-500 shadow-red-500/20",
    blue: "bg-blue-500 text-blue-500 shadow-blue-500/20",
    emerald: "bg-emerald-500 text-emerald-500 shadow-emerald-500/20",
    amber: "bg-amber-500 text-amber-500 shadow-amber-500/20"
  }

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div
          className={`bg-opacity-10 flex h-12 w-12 items-center justify-center rounded-2xl ${colorMap[color].split(" ")[0]} bg-opacity-10 text-opacity-100`}
        >
          <Icon className={`h-6 w-6 ${colorMap[color].split(" ")[1]}`} />
        </div>
        {change && (
          <span
            className={`text-[10px] font-black tracking-wider uppercase ${color === "red" ? "text-red-500" : "text-emerald-500"}`}
          >
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{title}</p>
        <h3 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
          {value}
        </h3>
        {description && (
          <p className="mt-1 text-[11px] font-medium text-slate-500 italic">{description}</p>
        )}
      </div>
    </div>
  )
}

function ActivityItem({ status, name, time, details }: any) {
  return (
    <div className="flex items-center gap-4 border-b border-slate-50 py-4 first:pt-0 last:border-0 dark:border-slate-800">
      <div
        className={`h-3 w-3 shrink-0 rounded-full ${status === "UP" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"}`}
      />
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{name}</h4>
        <p className="text-[10px] text-slate-500">{details}</p>
      </div>
      <span className="shrink-0 text-[10px] font-medium text-slate-400 italic">{time}</span>
    </div>
  )
}

function RenewalItem({ type, name, days, color }: any) {
  const colors: any = {
    red: "text-red-500 bg-red-50 dark:bg-red-950/30",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-950/30",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${colors[color]}`}
      >
        {type}
      </div>
      <div className="flex-1 truncate">
        <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{name}</h4>
        <p className="text-[10px] text-slate-500">Expires in {days} days</p>
      </div>
    </div>
  )
}
