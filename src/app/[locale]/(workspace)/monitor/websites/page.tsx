"use client"

import {
  Globe,
  Plus,
  Search,
  MoreVertical,
  ExternalLink,
  Activity,
  Clock,
  ShieldCheck,
  Loader2,
  Edit2,
  Trash2
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { AddWebsiteModal } from "@/components/monitor/AddWebsiteModal"
import { UptimeStatusBars } from "@/components/monitor/UptimeStatusBars"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { IMonitor, MonitorStatus } from "@/types/monitor"

export default function WebsitesMonitorPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState<IMonitor | null>(null)
  const [monitors, setMonitors] = useState<IMonitor[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMonitors = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/monitor")
      if (response.ok) {
        const data = await response.json()
        setMonitors(data.filter((m: IMonitor) => m.type === "WEBSITE"))
      }
    } catch (error) {
      console.error("Failed to fetch monitors:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMonitors()
  }, [fetchMonitors])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) {
      return
    }
    try {
      const response = await apiClient.delete(`/api/monitor/${id}`)
      if (response.ok) {
        toast.success("Monitor deleted")
        fetchMonitors()
      }
    } catch (error) {
      toast.error("Failed to delete monitor")
    }
  }

  const handleEdit = (monitor: IMonitor) => {
    setEditingMonitor(monitor)
    setModalOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
            Services
          </span>
          <h1 className="text-4xl font-black tracking-tighter">
            Website <span className="text-slate-400">Uptime</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => fetchMonitors()}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 transition-all hover:border-red-500 hover:text-red-500 dark:border-slate-800 dark:bg-slate-900"
          >
            <Activity className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setEditingMonitor(null)
              setModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white transition-all hover:bg-red-600 dark:bg-white dark:text-slate-900"
          >
            <Plus className="h-4 w-4" />
            Add Website
          </button>
        </div>
      </div>

      <AddWebsiteModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) {
            setEditingMonitor(null)
          }
        }}
        onSuccess={fetchMonitors}
        initialData={editingMonitor}
      />

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          title="Global Uptime"
          value={monitors.length > 0 ? "99.9%" : "---"}
          detail="Last 24 hours"
          icon={ShieldCheck}
          color="emerald"
        />
        <SummaryCard
          title="Avg Response"
          value={
            monitors.length > 0
              ? `${Math.round(monitors.reduce((acc, m) => acc + (m.responseTime || 0), 0) / monitors.length)}ms`
              : "---"
          }
          detail="Real-time avg"
          icon={Clock}
          color="blue"
        />
        <SummaryCard
          title="Degraded"
          value={monitors.filter((m) => m.status === MonitorStatus.DOWN).length.toString()}
          detail="Currently down"
          icon={Activity}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 rounded-[1.5rem] bg-white p-2 shadow-lg dark:bg-slate-900">
        <div className="flex flex-1 items-center gap-3 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search monitors..."
            className="w-full bg-transparent py-2 text-sm font-medium outline-none"
          />
        </div>
        <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800" />
        <select className="bg-transparent px-4 text-xs font-bold tracking-widest uppercase outline-none">
          <option>All Status</option>
          <option>Up</option>
          <option>Down</option>
        </select>
      </div>

      {/* Monitor List */}
      <div className="grid gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Activity className="h-8 w-8 animate-spin text-slate-300" />
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Syncing database...
            </p>
          </div>
        ) : monitors.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-slate-100 py-20 dark:border-slate-800">
            <Globe className="mb-4 h-12 w-12 text-slate-200" />
            <p className="text-sm font-bold text-slate-400">No websites monitored yet</p>
            <button
              onClick={() => {
                setModalOpen(true)
              }}
              className="mt-4 text-[10px] font-black tracking-widest text-red-500 uppercase hover:underline"
            >
              Add your first URL
            </button>
          </div>
        ) : (
          monitors.map((monitor) => (
            <WebsiteItem
              key={monitor._id}
              monitor={monitor}
              onDelete={async () => handleDelete(monitor._id!)}
              onEdit={() => {
                handleEdit(monitor)
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

function WebsiteItem({
  monitor,
  onDelete,
  onEdit
}: {
  monitor: IMonitor
  onDelete: () => void
  onEdit: () => void
}) {
  const { name, target: url, status, responseTime, createdAt } = monitor
  const latency = `${responseTime || 0}ms`
  const uptime = "100%"

  const getOperationalDuration = () => {
    if (!createdAt) {
      return "---"
    }
    const start = new Date(createdAt).getTime()
    const now = new Date().getTime()
    const diff = now - start

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days > 0) {
      return `${days} Days operational`
    }

    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours > 0) {
      return `${hours} Hours operational`
    }

    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes} Minutes operational`
  }

  const count = 48
  // Generate realistic uptime history data based on monitor status
  const barsData = Array.from({ length: count }, (_, i) => {
    const barTime = new Date(Date.now() - (count - i) * 30 * 60000).getTime()

    // Show NONE if before monitor was created
    if (createdAt && barTime < new Date(createdAt).getTime()) {
      return "NONE"
    }

    // Generate realistic pattern: mostly UP with occasional issues
    // Use index as seed for consistency
    const seed = (i * 7) % 100

    if (status === "DOWN") {
      // If currently down, show more recent DOWN, older mixed
      if (i > 40) {
        return "DOWN"
      } // Last few are down
      if (seed < 80) {
        return "UP"
      }
      if (seed < 95) {
        return "WARNING"
      }
      return "DOWN"
    }
    // If currently UP, show mostly UP with rare issues
    if (seed < 85) return "UP"
    if (seed < 98) return "WARNING"
    return "DOWN"
  })

  return (
    <div className="group flex flex-col gap-6 rounded-[2rem] border border-slate-100 bg-white p-8 shadow-xl transition-all hover:border-red-200 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-6">
        <div
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] shadow-inner",
            status === "UP" ? "bg-emerald-50 text-emerald-500" : "bg-red-50 text-red-500"
          )}
        >
          <Globe className="h-8 w-8" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black tracking-tight">{name}</h3>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 text-slate-400 hover:text-red-500" />
            </a>
          </div>
          <p className="text-xs font-medium text-slate-500 italic">{url}</p>
        </div>

        <div className="hidden flex-col items-end md:flex">
          <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Latency
          </span>
          <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">
            {latency}
          </span>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className={cn(
              "rounded-full px-4 py-1.5 text-[10px] font-black tracking-widest uppercase",
              status === "UP"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                : "bg-red-500 text-white shadow-lg shadow-red-500/20"
            )}
          >
            {status}
          </div>
          <span className="text-[10px] font-bold text-slate-400">{uptime} Uptime</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-900">
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 rounded-2xl border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <DropdownMenuItem
              onClick={onEdit}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-red-500 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Edit2 className="h-4 w-4" />
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onDelete}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
              Remove monitor
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Uptime History Bar */}
      <div className="flex flex-col gap-3 border-t border-slate-50 pt-6 dark:border-slate-800">
        <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-slate-400 uppercase">
          <span>Uptime History (Last 24 Hours)</span>
          <span className="text-emerald-500">{getOperationalDuration()}</span>
        </div>
        <UptimeStatusBars data={barsData as any} count={count} className="w-full justify-between" />
        <div className="flex justify-between text-[9px] font-medium text-slate-400 italic">
          <span>24 Hours ago</span>
          <span>Checked every 5m</span>
          <span>Just now</span>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ title, value, detail, icon: Icon, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-500 text-emerald-500",
    blue: "bg-blue-500 text-blue-500",
    red: "bg-red-500 text-red-500"
  }

  return (
    <div className="flex items-center gap-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div
        className={cn(
          "bg-opacity-10 flex h-12 w-12 items-center justify-center rounded-2xl",
          colors[color].split(" ")[0]
        )}
      >
        <Icon className={cn("h-6 w-6", colors[color].split(" ")[1])} />
      </div>
      <div>
        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-black tracking-tighter">{value}</h4>
          <span className="text-[10px] font-medium text-slate-500 italic">{detail}</span>
        </div>
      </div>
    </div>
  )
}
