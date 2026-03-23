"use client"

import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Filter,
  Search,
  Eye,
  Download,
  ExternalLink,
  FileText,
  FileBarChart,
  FileCode,
  Paperclip,
  Shield,
  X,
  Users,
  LayersIcon,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

import { StatusBadge, UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { apiClient } from "@/lib/api/client"
import { cn, formatDate } from "@/lib/utils"

interface Report {
  _id: string
  title: string
  submittedBy: { id: string; name: string; email: string; avatar?: string }
  submittedAt: string
  dueDate: string
  weekNumber: number
  year: number
  status: "submitted" | "overdue" | "pending"
  fileType?: "ppt" | "pdf" | "doc" | "link" | "generated"
  fileUrl?: string
  fileName?: string
  fileSize?: string
  description?: string
}

type GroupBy = "none" | "member" | "week" | "status"

interface ReportGroup {
  key: string
  label: string
  sublabel?: string
  reports: Report[]
  memberInfo?: { id: string; name: string; email: string; avatar?: string }
  status?: string
}

export default function AdminReportsPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? "en"

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [activeMemberId, setActiveMemberId] = useState<string | null>(null)
  const DIRECTORY_PAGE_SIZE = 10
  const [directoryPage, setDirectoryPage] = useState(1)

  // --- Filters ---
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterMonth, setFilterMonth] = useState("")
  const [filterWeek, setFilterWeek] = useState("")
  const [groupBy, setGroupBy] = useState<GroupBy>("member")

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Directory view is only meaningful for member grouping.
    if (groupBy !== "member") {
      setActiveMemberId(null)
    }
  }, [groupBy])

  useEffect(() => {
    // Reset pagination when switching members or when the underlying list changes (filters/search).
    setDirectoryPage(1)
  }, [activeMemberId, searchTerm, filterStatus, filterType, filterWeek, filterMonth, groupBy])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get("/api/reports/admin")
      if (res.status === 403) {
        setAccessDenied(true)
        return
      }
      if (!res.ok) {
        throw new Error("Failed to load")
      }
      setReports(await res.json())
    } catch {
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  // ---- Derived: filtered reports (all client-side) ----
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // text search
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const match =
          r.title.toLowerCase().includes(q) ||
          r.submittedBy.name.toLowerCase().includes(q) ||
          r.submittedBy.email.toLowerCase().includes(q)
        if (!match) {
          return false
        }
      }
      // status
      if (filterStatus !== "all" && r.status !== filterStatus) {
        return false
      }
      // file type
      if (filterType !== "all" && (r.fileType ?? "other") !== filterType) {
        return false
      }
      // week number
      if (filterWeek && String(r.weekNumber) !== filterWeek) {
        return false
      }
      // month (YYYY-MM)
      if (filterMonth) {
        const submitted = r.submittedAt ? new Date(r.submittedAt) : null
        if (!submitted) {
          return false
        }
        const ym = `${submitted.getFullYear()}-${String(submitted.getMonth() + 1).padStart(2, "0")}`
        if (ym !== filterMonth) {
          return false
        }
      }
      return true
    })
  }, [reports, searchTerm, filterStatus, filterType, filterWeek, filterMonth])

  // ---- Derived: grouped reports ----
  const groupedReports = useMemo((): ReportGroup[] => {
    if (groupBy === "none") {
      return [{ key: "all", label: "All Reports", reports: filteredReports }]
    }

    if (groupBy === "member") {
      const map = new Map<string, ReportGroup>()
      for (const r of filteredReports) {
        const k = r.submittedBy.id
        if (!map.has(k)) {
          map.set(k, {
            key: k,
            label: r.submittedBy.name,
            sublabel: r.submittedBy.email,
            reports: [],
            memberInfo: r.submittedBy
          })
        }
        map.get(k)!.reports.push(r)
      }
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    }

    if (groupBy === "week") {
      const map = new Map<string, ReportGroup>()
      for (const r of filteredReports) {
        const k = `${r.year}-W${String(r.weekNumber).padStart(2, "0")}`
        if (!map.has(k)) {
          map.set(k, {
            key: k,
            label: `Week ${r.weekNumber}`,
            sublabel: String(r.year),
            reports: []
          })
        }
        map.get(k)!.reports.push(r)
      }
      return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key))
    }

    if (groupBy === "status") {
      const order = ["overdue", "pending", "submitted"]
      const map = new Map<string, ReportGroup>()
      for (const r of filteredReports) {
        const k = r.status
        if (!map.has(k)) {
          map.set(k, {
            key: k,
            label: r.status.charAt(0).toUpperCase() + r.status.slice(1),
            reports: [],
            status: r.status
          })
        }
        map.get(k)!.reports.push(r)
      }
      return order.filter((o) => map.has(o)).map((o) => map.get(o)!)
    }

    return []
  }, [filteredReports, groupBy])

  const memberDirectory = useMemo(() => {
    // For the directory view: list unique members and their reports (honoring filters).
    const map = new Map<
      string,
      { memberInfo: NonNullable<Report["submittedBy"]>; reports: Report[] }
    >()

    for (const r of filteredReports) {
      const k = r.submittedBy.id
      if (!map.has(k)) {
        map.set(k, { memberInfo: r.submittedBy, reports: [] })
      }
      map.get(k)!.reports.push(r)
    }

    const members = Array.from(map.values())
    for (const m of members) {
      // Always show newest first for “by date”.
      m.reports.sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
    }

    return members.sort((a, b) => a.memberInfo.name.localeCompare(b.memberInfo.name))
  }, [filteredReports])

  useEffect(() => {
    if (!activeMemberId) {
      return
    }
    const stillExists = memberDirectory.some((m) => m.memberInfo.id === activeMemberId)
    if (!stillExists) {
      setActiveMemberId(null)
    }
  }, [memberDirectory, activeMemberId])

  const activeMember = useMemo(() => {
    if (!activeMemberId) {
      return null
    }
    return memberDirectory.find((m) => m.memberInfo.id === activeMemberId) ?? null
  }, [memberDirectory, activeMemberId])

  // ---- Helpers ----
  const stats = {
    total: reports.length,
    submitted: reports.filter((r) => r.status === "submitted").length,
    overdue: reports.filter((r) => r.status === "overdue").length,
    pending: reports.filter((r) => r.status === "pending").length
  }

  const hasActiveFilters =
    searchTerm !== "" ||
    filterStatus !== "all" ||
    filterType !== "all" ||
    filterWeek !== "" ||
    filterMonth !== ""

  const clearFilters = () => {
    setSearchTerm("")
    setFilterStatus("all")
    setFilterType("all")
    setFilterWeek("")
    setFilterMonth("")
  }

  const toggleGroup = (key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case "ppt":
        return <FileBarChart className="h-4 w-4 text-orange-500" />
      case "pdf":
        return <FileCode className="h-4 w-4 text-red-500" />
      case "doc":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "link":
        return <ExternalLink className="h-4 w-4 text-indigo-500" />
      default:
        return <Paperclip className="h-4 w-4 text-slate-400" />
    }
  }

  const statusColor = (status: string) => {
    if (status === "submitted") {
      return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20"
    }
    if (status === "overdue") {
      return "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20"
    }
    return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20"
  }

  const groupStatusGradient = (status?: string) => {
    if (status === "submitted") {
      return "from-emerald-500 to-emerald-700"
    }
    if (status === "overdue") {
      return "from-rose-500 to-rose-700"
    }
    if (status === "pending") {
      return "from-amber-500 to-amber-700"
    }
    return "from-indigo-500 to-purple-700"
  }

  if (accessDenied) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-8 p-12">
        <div className="flex h-24 w-24 items-center justify-center rounded-4xl bg-red-50 dark:bg-red-900/20">
          <Shield className="h-12 w-12 text-red-500" />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
            Access Denied
          </h1>
          <p className="mt-3 text-lg font-medium text-slate-500">
            This page is only accessible to Admins and Owners.
          </p>
        </div>
        <Link href={`/${locale}/reports`}>
          <Button
            variant="outline"
            size="lg"
            className="h-14 gap-3 rounded-2xl px-8 text-sm font-black tracking-widest uppercase"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Ambient bg blobs */}
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-150 w-150 rounded-full bg-indigo-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-125 w-125 rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="mx-auto max-w-400 space-y-10 p-8 lg:p-12">
        {/* ─── Page Header ─── */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <Link href={`/${locale}/reports`}>
              <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-x-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-linear-to-r from-indigo-600 to-purple-700 opacity-20 blur transition duration-1000 group-hover:opacity-40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/30">
                <Users className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                Admin View
              </span>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                All{" "}
                <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Reports
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic dark:text-slate-400">
                Track submissions across your entire organization
              </p>
            </div>
          </div>
        </div>

        {/* ─── Stat Cards ─── */}
        <div className="grid gap-5 md:grid-cols-4">
          {[
            {
              label: "Total Reports",
              value: stats.total,
              Icon: LayersIcon,
              cls: "from-slate-600 to-slate-800",
              shadow: "shadow-slate-500/20"
            },
            {
              label: "Submitted",
              value: stats.submitted,
              Icon: CheckCircle2,
              cls: "from-emerald-500 to-emerald-700",
              shadow: "shadow-emerald-500/20"
            },
            {
              label: "Overdue",
              value: stats.overdue,
              Icon: AlertCircle,
              cls: "from-rose-500 to-rose-700",
              shadow: "shadow-rose-500/20"
            },
            {
              label: "Pending",
              value: stats.pending,
              Icon: Clock,
              cls: "from-amber-500 to-amber-700",
              shadow: "shadow-amber-500/20"
            }
          ].map(({ label, value, Icon, cls, shadow }) => (
            <Card
              key={label}
              className="overflow-hidden rounded-4xl border-none bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:bg-slate-900/60"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      {label}
                    </p>
                    <p className="mt-2 text-5xl font-black tracking-tighter text-slate-900 dark:text-white">
                      {value}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-xl",
                      cls,
                      shadow
                    )}
                  >
                    <Icon className="h-7 w-7 stroke-[2.5]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ─── Filter + Group Controls ─── */}
        <div className="space-y-4 rounded-4xl border border-slate-100 bg-white/60 p-6 shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/60">
          {/* Row 1: Search + File Type + Status + Month */}
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="relative min-w-52 flex-1">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name, email, or title…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                }}
                className="h-11 w-full rounded-2xl border border-slate-100 bg-white pr-4 pl-11 text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
              />
            </div>

            {/* Month picker */}
            <div className="relative">
              <Calendar className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value)
                }}
                className="h-11 rounded-2xl border border-slate-100 bg-white pr-4 pl-9 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                style={{ colorScheme: "light" }}
              />
            </div>

            {/* Week number */}
            <input
              type="number"
              placeholder="Week #"
              min={1}
              max={53}
              value={filterWeek}
              onChange={(e) => {
                setFilterWeek(e.target.value)
              }}
              className="h-11 w-24 rounded-2xl border border-slate-100 bg-white px-4 text-xs font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
            />

            {/* File type dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-2xl border-slate-100 bg-white px-5 text-[10px] font-black tracking-widest uppercase shadow-none dark:bg-slate-950"
                >
                  <FileText className="h-4 w-4 text-indigo-500" />
                  {filterType === "all" ? "All Types" : filterType.toUpperCase()}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl p-2 shadow-2xl">
                <DropdownMenuLabel className="p-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  File Type
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  ["all", "All Types"],
                  ["ppt", "PPT / Slides"],
                  ["pdf", "PDF"],
                  ["doc", "Document"],
                  ["link", "Link"],
                  ["generated", "Generated"]
                ].map(([v, l]) => (
                  <DropdownMenuItem
                    key={v}
                    onClick={() => {
                      setFilterType(v)
                    }}
                    className={cn(
                      "gap-3 rounded-xl py-2.5 text-xs font-bold",
                      filterType === v && "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30"
                    )}
                  >
                    {l}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-2xl border-slate-100 bg-white px-5 text-[10px] font-black tracking-widest uppercase shadow-none dark:bg-slate-950"
                >
                  <Filter className="h-4 w-4 text-indigo-500" />
                  {filterStatus === "all" ? "All Status" : filterStatus}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl p-2 shadow-2xl">
                <DropdownMenuLabel className="p-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Status
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  ["all", "All Status"],
                  ["submitted", "Submitted"],
                  ["overdue", "Overdue"],
                  ["pending", "Pending"]
                ].map(([v, l]) => (
                  <DropdownMenuItem
                    key={v}
                    onClick={() => {
                      setFilterStatus(v)
                    }}
                    className={cn(
                      "gap-3 rounded-xl py-2.5 text-xs font-bold",
                      filterStatus === v && "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30"
                    )}
                  >
                    {l}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear button */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="h-11 gap-2 rounded-2xl px-4 text-[10px] font-black tracking-widest text-rose-500 uppercase hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"
              >
                <XCircle className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Row 2: Group By selector */}
          <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Group by
            </span>
            <div className="flex rounded-2xl border border-slate-100 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
              {(
                [
                  ["none", "None"],
                  ["member", "Member"],
                  ["week", "Week"],
                  ["status", "Status"]
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => {
                    setGroupBy(v)
                  }}
                  className={cn(
                    "rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase transition-all",
                    groupBy === v
                      ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs font-bold text-slate-400">
              {filteredReports.length} of {reports.length} reports
            </span>
          </div>
        </div>

        {/* ─── Report List / Groups ─── */}
        <div className="space-y-6">
          {loading ? (
            <div className="py-32 text-center text-sm font-bold text-slate-400">
              Loading all reports…
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="rounded-4xl border-none bg-white/40 p-24 text-center backdrop-blur-xl dark:bg-slate-900/40">
              <Users className="mx-auto mb-6 h-16 w-16 text-slate-200" />
              <h3 className="text-2xl font-black tracking-tight text-slate-400 uppercase">
                No reports found
              </h3>
              <p className="mt-2 text-sm text-slate-400">Try adjusting your filters</p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-6 h-11 gap-2 rounded-2xl text-[10px] font-black tracking-widest uppercase"
                >
                  <XCircle className="h-4 w-4" />
                  Clear all filters
                </Button>
              )}
            </Card>
          ) : groupBy === "member" ? (
            <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
              {/* Directory: pick a member */}
              <div className="space-y-4 rounded-4xl border border-slate-100 bg-white/60 p-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Members
                    </h3>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Click a user to view reports
                    </p>
                  </div>
                  {activeMemberId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 rounded-xl px-3 text-[10px] font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => {
                        setActiveMemberId(null)
                      }}
                    >
                      All
                    </Button>
                  )}
                </div>

                <div className="max-h-[62vh] space-y-2 overflow-y-auto pr-2">
                  {memberDirectory.map((m) => {
                    const isActive = m.memberInfo.id === activeMemberId
                    return (
                      <button
                        key={m.memberInfo.id}
                        onClick={() => {
                          setActiveMemberId(m.memberInfo.id)
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-3xl border px-4 py-3 text-left transition-all",
                          isActive
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-100 bg-white/40 hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-indigo-900/20"
                        )}
                      >
                        <UserAvatar
                          name={m.memberInfo.name}
                          image={m.memberInfo.avatar}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                            {m.memberInfo.name}
                          </p>
                          <p className="truncate text-xs font-medium text-slate-400">
                            {m.memberInfo.email}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-xl bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {m.reports.length}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Directory detail */}
              <div className="space-y-4">
                <div className="rounded-4xl border border-slate-100 bg-white/60 p-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/40">
                  {!activeMember ? (
                    <div className="flex flex-col items-start gap-2">
                      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                        Select a member
                      </h3>
                      <p className="text-sm font-medium text-slate-500">
                        Choose a user from the directory to see reports ordered by submitted date.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-black tracking-tight text-slate-900 dark:text-white">
                          {activeMember.memberInfo.name}
                        </h3>
                        <p className="mt-1 truncate text-sm font-medium text-slate-500">
                          {activeMember.memberInfo.email}
                        </p>
                      </div>
                      <span className="rounded-2xl bg-slate-100 px-4 py-2 text-[10px] font-black tracking-widest text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                        {activeMember.reports.length} report
                        {activeMember.reports.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>

                {activeMember ? (
                  <div className="grid gap-3">
                    {activeMember.reports
                      .slice(
                        (directoryPage - 1) * DIRECTORY_PAGE_SIZE,
                        directoryPage * DIRECTORY_PAGE_SIZE
                      )
                      .map((report) => (
                        <ReportRow
                          key={report._id}
                          report={report}
                          getFileIcon={getFileIcon}
                          statusColor={statusColor}
                          onView={() => {
                            setSelectedReport(report)
                          }}
                        />
                      ))}
                  </div>
                ) : (
                  <Card className="rounded-4xl border-none bg-white/40 p-24 text-center backdrop-blur-xl dark:bg-slate-900/40">
                    <Users className="mx-auto mb-6 h-16 w-16 text-slate-200" />
                    <h3 className="text-2xl font-black tracking-tight text-slate-400 uppercase">
                      No member selected
                    </h3>
                    <p className="mt-2 text-sm text-slate-400">Pick a user on the left.</p>
                  </Card>
                )}

                {activeMember &&
                  (() => {
                    const totalPages = Math.max(
                      1,
                      Math.ceil(activeMember.reports.length / DIRECTORY_PAGE_SIZE)
                    )
                    return (
                      <div className="flex items-center justify-between gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="h-11 flex-1 rounded-2xl border-slate-200 bg-white/50 text-[10px] font-black tracking-widest uppercase hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20"
                          disabled={directoryPage <= 1}
                          onClick={() => {
                            setDirectoryPage((p) => Math.max(1, p - 1))
                          }}
                        >
                          Prev
                        </Button>

                        <span className="shrink-0 text-xs font-bold text-slate-500">
                          Page {directoryPage} of {totalPages}
                        </span>

                        <Button
                          variant="outline"
                          className="h-11 flex-1 rounded-2xl border-slate-200 bg-white/50 text-[10px] font-black tracking-widest uppercase hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/20"
                          disabled={directoryPage >= totalPages}
                          onClick={() => {
                            setDirectoryPage((p) => Math.min(totalPages, p + 1))
                          }}
                        >
                          Next
                        </Button>
                      </div>
                    )
                  })()}
              </div>
            </div>
          ) : (
            groupedReports.map((group) => (
              <div key={group.key} className="space-y-3">
                {/* Group Header (hidden when groupBy=none) */}
                {groupBy !== "none" && (
                  <button
                    onClick={() => {
                      toggleGroup(group.key)
                    }}
                    className="flex w-full items-center gap-4 text-left"
                  >
                    {/* Avatar / icon */}
                    {group.memberInfo ? (
                      <UserAvatar
                        name={group.memberInfo.name}
                        image={group.memberInfo.avatar}
                        size="md"
                      />
                    ) : (
                      <div
                        className={cn(
                          "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-linear-to-br text-white shadow-lg",
                          groupStatusGradient(group.status)
                        )}
                      >
                        {groupBy === "week" ? (
                          <Calendar className="h-5 w-5" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                          {group.label}
                        </span>
                        {group.sublabel && (
                          <span className="text-xs font-medium text-slate-400">
                            {group.sublabel}
                          </span>
                        )}
                        <span className="ml-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black text-slate-500 dark:bg-slate-800">
                          {group.reports.length} report{group.reports.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {group.memberInfo && (
                        <p className="text-xs font-medium text-slate-400">
                          {group.memberInfo.email}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {collapsedGroups.has(group.key) ? (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-400" />
                      )}
                    </div>
                  </button>
                )}

                {/* Report rows in this group */}
                {!collapsedGroups.has(group.key) && (
                  <div className={cn("grid gap-3", groupBy !== "none" && "pl-14")}>
                    {group.reports.map((report) => (
                      <ReportRow
                        key={report._id}
                        report={report}
                        getFileIcon={getFileIcon}
                        statusColor={statusColor}
                        onView={() => {
                          setSelectedReport(report)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── View Modal ─── */}
      {selectedReport && (
        <ViewReportModal
          report={selectedReport}
          getFileIcon={getFileIcon}
          onClose={() => {
            setSelectedReport(null)
          }}
        />
      )}
    </div>
  )
}

/* ─── Report Row ─── */
function ReportRow({
  report,
  getFileIcon,
  statusColor,
  onView
}: {
  report: Report
  getFileIcon: (t?: string) => React.ReactNode
  statusColor: (s: string) => string
  onView: () => void
}) {
  return (
    <Card className="group overflow-hidden rounded-3xl border-none bg-white/60 shadow-[0_2px_12px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.08)] dark:bg-slate-900/60">
      <CardContent className="p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {/* Title + meta */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-slate-900 dark:text-white">
              {report.title}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Week {report.weekNumber}, {report.year}
              </span>
              <span className="flex items-center gap-1">
                {getFileIcon(report.fileType)}
                {(report.fileType ?? "N/A").toUpperCase()}
              </span>
              {report.status !== "pending" && report.submittedAt && (
                <span className="text-slate-300">{formatDate(new Date(report.submittedAt))}</span>
              )}
            </div>
          </div>

          {/* Status + actions */}
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge
              type="custom"
              value={report.status}
              className={cn("font-black tracking-widest uppercase", statusColor(report.status))}
            />
            {(report.fileUrl || report.description) && report.status !== "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="h-9 gap-1.5 rounded-xl border-slate-100 px-4 text-[9px] font-black tracking-widest uppercase hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900"
              >
                <Eye className="h-3.5 w-3.5" />
                View
              </Button>
            )}
            {report.fileUrl && report.fileType !== "link" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(report.fileUrl, "_blank")}
                className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-blue-600"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            )}
            {report.fileUrl && report.fileType === "link" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(report.fileUrl, "_blank")}
                className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── View Report Modal ─── */
function ViewReportModal({
  report,
  getFileIcon,
  onClose
}: {
  report: Report
  getFileIcon: (t?: string) => React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-4xl border border-slate-200 bg-white/95 p-8 shadow-2xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95"
        onClick={(e) => {
          e.stopPropagation()
        }}
      >
        {/* Modal header */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              {getFileIcon(report.fileType)}
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase">{report.title}</h2>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                {report.submittedBy.name} · Week {report.weekNumber}, {report.year}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Member info */}
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
            <UserAvatar
              name={report.submittedBy.name}
              image={report.submittedBy.avatar}
              size="lg"
            />
            <div>
              <p className="font-black text-slate-900 dark:text-white">{report.submittedBy.name}</p>
              <p className="text-sm text-slate-400">{report.submittedBy.email}</p>
              {report.status !== "pending" && report.submittedAt && (
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Submitted {formatDate(new Date(report.submittedAt))}
                </p>
              )}
            </div>
          </div>

          {/* Detail grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Week", value: `Week ${report.weekNumber}` },
              { label: "Year", value: String(report.year) },
              { label: "Status", value: report.status, badge: true },
              { label: "Type", value: report.fileType?.toUpperCase() ?? "—" }
            ].map(({ label, value, badge }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <p className="mb-1 text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  {label}
                </p>
                {badge ? (
                  <StatusBadge
                    type="custom"
                    value={value}
                    size="sm"
                    className="font-black tracking-widest uppercase"
                  />
                ) : (
                  <p className="text-xs font-black uppercase">{value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Notes / summary */}
          {report.description && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="mb-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Notes / Summary
              </p>
              <pre className="max-h-56 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                {report.description}
              </pre>
            </div>
          )}

          {report.fileName && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
              <Paperclip className="h-4 w-4 text-slate-400" />
              <span className="flex-1 truncate text-xs font-bold text-slate-600 dark:text-slate-300">
                {report.fileName}
              </span>
              {report.fileSize && (
                <span className="text-[10px] text-slate-400">{report.fileSize}</span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {report.fileUrl ? (
              <>
                <Button
                  onClick={() => window.open(report.fileUrl, "_blank")}
                  className="h-12 flex-1 gap-2 rounded-xl bg-indigo-600 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-700"
                >
                  <ExternalLink className="h-4 w-4" />
                  {report.fileType === "link" ? "Open Link" : "Open File"}
                </Button>
                {report.fileType !== "link" && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(report.fileUrl, "_blank")}
                    className="h-12 gap-2 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-slate-900 hover:text-white"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
              </>
            ) : (
              <p className="py-3 text-sm font-medium text-slate-400 italic">
                Generated report — content shown in notes above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
