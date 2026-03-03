"use client"

import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Link2,
  Plus,
  Upload,
  X,
  AlertCircle,
  Filter,
  Search,
  Eye,
  ExternalLink,
  Paperclip,
  TrendingUp,
  FileCode,
  FileBarChart,
  Zap,
  Shield,
  Sparkles,
  CircleDot,
  CircleCheck,
  Circle,
  Users,
  MoreVertical
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useState, useMemo, useEffect, useRef } from "react"
import { toast } from "sonner"

import { StatCard, StatusBadge, UserAvatar } from "@/components/common"
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
import { Progress } from "@/components/ui/progress"
import { apiClient } from "@/lib/api/client"
import { cn, formatDate } from "@/lib/utils"

interface Report {
  _id: string
  title: string
  submittedBy: { id: string; name: string; email: string; avatar?: string }
  submittedAt: Date
  dueDate: Date
  weekNumber: number
  year: number
  status: "submitted" | "overdue" | "pending"
  fileType?: "ppt" | "pdf" | "doc" | "link" | "generated"
  fileUrl?: string
  fileName?: string
  fileSize?: string
  description?: string
}

interface TaskItem {
  _id: string
  title: string
  priority: string
  project: string | null
}

interface GeneratedReport {
  weekNumber: number
  year: number
  stats: { total: number; done: number; inProgress: number; todo: number }
  tasks: {
    done: TaskItem[]
    inProgress: TaskItem[]
    todo: TaskItem[]
  }
  summary: string
}

type ModalTab = "upload" | "link" | "generate"

const MAX_SIZE = 100 * 1024 * 1024

interface DeleteConfirmState {
  show: boolean
  reportId: string | null
  loading: boolean
}

function formatBytes(b: number) {
  if (b < 1024) {
    return b + " B"
  }
  if (b < 1024 * 1024) {
    return (b / 1024).toFixed(1) + " KB"
  }
  return (b / (1024 * 1024)).toFixed(1) + " MB"
}

function getWeekNumber(d: Date): number {
  const first = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - first.getTime()) / 86400000 + first.getDay() + 1) / 7)
}

function getNextMonday(): Date {
  const today = new Date()
  const diff = today.getDay() === 0 ? 1 : 8 - today.getDay()
  const next = new Date(today)
  next.setDate(today.getDate() + diff)
  next.setHours(23, 59, 59, 999)
  return next
}

export default function ReportsPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? "en"

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [modalTab, setModalTab] = useState<ModalTab>("upload")
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    show: false,
    reportId: null,
    loading: false
  })
  const [replaceReport, setReplaceReport] = useState<Report | null>(null)

  // S3 upload state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Form fields
  const [reportTitle, setReportTitle] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [reportUrl, setReportUrl] = useState("")

  // Task generation
  const [generating, setGenerating] = useState(false)
  const [generatedData, setGeneratedData] = useState<GeneratedReport | null>(null)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get("/api/reports")
      if (res.ok) {
        setReports(await res.json())
      }
    } catch {
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    setDeleteConfirm({ show: true, reportId, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.reportId) {
      return
    }

    setDeleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      const res = await apiClient.delete(`/api/reports/${deleteConfirm.reportId}`)
      if (!res.ok) {
        throw new Error("Failed to delete report")
      }
      toast.success("Report deleted successfully")
      setDeleteConfirm({ show: false, reportId: null, loading: false })
      fetchReports()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete report"
      toast.error(msg)
      setDeleteConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  const handleReplaceReport = (report: Report) => {
    setReplaceReport(report)
    setReportTitle(report.title)
    setReportDescription(report.description || "")
    setShowSubmitModal(true)
    setModalTab("upload")
  }

  const handleSubmitReport = async () => {
    if (!reportTitle.trim()) {
      toast.error("Title is required")
      return
    }
    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)
    try {
      let payload: Record<string, unknown> = {
        title: reportTitle,
        description: reportDescription,
        dueDate: nextDueDate,
        weekNumber: currentWeek,
        year: new Date().getFullYear()
      }

      if (modalTab === "upload") {
        if (!file) {
          toast.error("Please select a file")
          setUploading(false)
          return
        }
        const { publicUrl, fileSize } = await uploadToS3(file)
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "doc"
        const type = ext === "pdf" ? "pdf" : ["ppt", "pptx"].includes(ext) ? "ppt" : "doc"
        payload = {
          ...payload,
          fileUrl: publicUrl,
          fileName: file.name,
          fileType: type,
          fileSize
        }
      } else if (modalTab === "link") {
        if (!reportUrl.trim()) {
          toast.error("Please enter a URL")
          setUploading(false)
          return
        }
        payload = {
          ...payload,
          fileUrl: reportUrl,
          fileName: "External Link",
          fileType: "link"
        }
      } else {
        if (!generatedData) {
          toast.error("Please generate a report first")
          setUploading(false)
          return
        }
        payload = {
          ...payload,
          fileType: "doc",
          fileName: `Task Report - Week ${generatedData.weekNumber}`,
          description: generatedData.summary,
          weekNumber: generatedData.weekNumber,
          year: generatedData.year
        }
      }

      setUploadProgress(92)

      // If replacing, call PUT instead of POST
      if (replaceReport) {
        const res = await apiClient.put(`/api/reports/${replaceReport._id}`, payload)
        if (!res.ok) {
          throw new Error("Failed to update report")
        }
      } else {
        const res = await apiClient.post("/api/reports", payload)
        if (!res.ok) {
          throw new Error("Failed to save report")
        }
      }

      setUploadProgress(100)
      toast.success(replaceReport ? "Report replaced!" : "Report submitted!")
      closeModal()
      fetchReports()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed"
      setUploadError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleGenerateTasks = async () => {
    setGenerating(true)
    setGeneratedData(null)
    try {
      const res = await apiClient.post("/api/reports/generate", {})
      if (!res.ok) {
        throw new Error("Failed to generate")
      }
      const data = await res.json()
      setGeneratedData(data)
      if (!reportTitle) {
        setReportTitle(`Task Report - Week ${data.weekNumber}, ${data.year}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch tasks"
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  const closeModal = () => {
    setShowSubmitModal(false)
    setFile(null)
    setUploadError(null)
    setUploadProgress(0)
    setReportTitle("")
    setReportDescription("")
    setReportUrl("")
    setGeneratedData(null)
    setModalTab("upload")
    setReplaceReport(null)
  }

  const nextDueDate = getNextMonday()
  const currentWeek = getWeekNumber(new Date())
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - Date.now()) / 86400000)

  const filteredReports = useMemo(
    () =>
      reports.filter((r) => {
        const q = searchTerm.toLowerCase()
        const matchSearch =
          r.title.toLowerCase().includes(q) || r.submittedBy.name.toLowerCase().includes(q)
        return matchSearch && (filterStatus === "all" || r.status === filterStatus)
      }),
    [reports, searchTerm, filterStatus]
  )

  const reportStats = {
    submitted: reports.filter((r) => r.status === "submitted").length,
    overdue: reports.filter((r) => r.status === "overdue").length,
    pending: reports.filter((r) => r.status === "pending").length
  }

  const validateFile = (f: File): string | null => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? ""
    const allowed = ["pdf", "ppt", "pptx", "doc", "docx", "txt", "md", "xls", "xlsx"]
    if (!allowed.includes(ext)) {
      return "Unsupported file type. Allowed: PDF, PPT, DOC, DOCX, XLS, TXT, MD"
    }
    if (f.size > MAX_SIZE) {
      return `File exceeds 100 MB limit (${formatBytes(f.size)})`
    }
    return null
  }

  const handleFileSelect = (f: File) => {
    setUploadError(null)
    const err = validateFile(f)
    if (err) {
      setUploadError(err)
      return
    }
    setFile(f)
    if (!reportTitle) {
      setReportTitle(f.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const uploadToS3 = async (f: File) => {
    setUploadProgress(10)
    const res = await apiClient.post("/api/upload/presigned", {
      fileName: f.name,
      fileType: f.type || "application/octet-stream",
      folder: "reports"
    })
    if (!res.ok) {
      throw new Error("Could not get upload URL")
    }
    const { uploadUrl, publicUrl } = await res.json()
    setUploadProgress(45)
    const s3 = await fetch(uploadUrl, {
      method: "PUT",
      body: f,
      headers: { "Content-Type": f.type || "application/octet-stream" }
    })
    if (!s3.ok) {
      throw new Error(`S3 upload failed (${s3.status})`)
    }
    setUploadProgress(85)
    return { publicUrl, fileSize: formatBytes(f.size) }
  }

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case "ppt":
        return <FileBarChart className="h-6 w-6 text-orange-500" />
      case "pdf":
        return <FileCode className="h-6 w-6 text-red-500" />
      case "doc":
        return <FileText className="h-6 w-6 text-blue-500" />
      case "link":
        return <ExternalLink className="h-6 w-6 text-indigo-500" />
      case "generated":
        return <Sparkles className="h-6 w-6 text-purple-500" />
      default:
        return <Paperclip className="h-6 w-6 text-slate-400" />
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Background blobs */}
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-150 w-150 rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-125 w-125 rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-400 space-y-12 p-8 lg:p-12">
        {/* ── Header ── */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30">
                <FileText className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                Reports Management
              </span>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Project{" "}
                <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reports
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic dark:text-slate-400">
                Upload, generate, and track your reports
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 pb-2">
            <Link href={`/${locale}/reports/admin`}>
              <Button
                variant="outline"
                size="lg"
                className="h-14 gap-2 rounded-2xl border-slate-200 px-6 text-sm font-black tracking-widest uppercase shadow-sm hover:shadow-md dark:border-slate-700"
              >
                <Users className="h-4 w-4" />
                All Members
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={() => {
                setShowSubmitModal(true)
              }}
              className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
            >
              <div className="absolute inset-0 bg-linear-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="h-5 w-5" />
              Submit Report
            </Button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Submission Deadline"
            value={`${daysUntilDue} Days`}
            subtitle={nextDueDate.toLocaleDateString("en-US", { weekday: "long" })}
            icon={Clock}
            variant="primary"
          />
          <StatCard
            title="Submitted"
            value={reportStats.submitted}
            subtitle="Reports submitted"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Overdue"
            value={reportStats.overdue}
            subtitle="Missed deadlines"
            icon={AlertCircle}
            variant="danger"
          />
          <StatCard
            title="Pending"
            value={reportStats.pending}
            subtitle="Awaiting submission"
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* ── Report list ── */}
        <div className="space-y-8">
          {/* List header + filters */}
          <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-2 md:flex-row md:items-center dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                <FileBarChart className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Report History</h2>
            </div>

            <div className="flex gap-3">
              <div className="group relative">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-100 bg-white pr-6 pl-12 text-xs font-bold shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none md:w-64 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 text-[10px] font-black tracking-widest uppercase shadow-sm dark:bg-slate-950"
                  >
                    <Filter className="h-4 w-4 text-blue-600" />
                    Status:{" "}
                    <span className="text-blue-600">
                      {filterStatus === "all" ? "All" : filterStatus}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                >
                  <DropdownMenuLabel className="p-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Filter Reports
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(
                    [
                      ["all", "All Reports"],
                      ["submitted", "Submitted"],
                      ["overdue", "Overdue"],
                      ["pending", "Pending"]
                    ] as const
                  ).map(([v, l]) => (
                    <DropdownMenuItem
                      key={v}
                      onClick={() => {
                        setFilterStatus(v)
                      }}
                      className="gap-3 rounded-xl py-3 font-bold"
                    >
                      {l}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Cards */}
          <div className="grid gap-6">
            {loading ? (
              <div className="py-24 text-center text-sm font-bold text-slate-400">Loading...</div>
            ) : filteredReports.length === 0 ? (
              <Card className="rounded-[2.5rem] border-none bg-white/40 p-24 text-center backdrop-blur-xl dark:bg-slate-900/40">
                <FileBarChart className="mx-auto mb-6 h-16 w-16 text-slate-200" />
                <h3 className="text-2xl font-black tracking-tight text-slate-400 uppercase">
                  No reports found
                </h3>
                <p className="mt-2 text-sm text-slate-400">Submit your first report above</p>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card
                  key={report._id}
                  className="group overflow-hidden rounded-4xl border-none bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:bg-slate-900/60"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                      {/* File icon + title */}
                      <div className="flex flex-1 items-start gap-6">
                        <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 shadow-inner transition-transform duration-500 group-hover:scale-110 dark:bg-slate-800">
                          {getFileIcon(report.fileType)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase transition-colors group-hover:text-blue-600 dark:text-white">
                              {report.title}
                            </h3>
                            <StatusBadge
                              type="custom"
                              value={report.status}
                              className={cn(
                                "font-black tracking-widest uppercase",
                                report.status === "submitted"
                                  ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                                  : report.status === "overdue"
                                    ? "border-rose-100 bg-rose-50 text-rose-700"
                                    : "border-amber-100 bg-amber-50 text-amber-700"
                              )}
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              Week {report.weekNumber}, {report.year}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="flex items-center gap-1.5">
                              <UserAvatar
                                name={report.submittedBy.name}
                                image={report.submittedBy.avatar}
                                size="xs"
                              />
                              {report.submittedBy.name}
                            </span>
                            {report.fileName && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                <span className="flex items-center gap-1.5">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {report.fileName}
                                </span>
                              </>
                            )}
                          </div>
                          {report.description && (
                            <p className="line-clamp-1 text-xs font-medium text-slate-500 italic">
                              {report.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 border-slate-100 lg:border-l lg:pl-8 dark:border-slate-800">
                        <div className="mr-4 hidden text-right sm:block">
                          <p className="mb-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                            Timestamp
                          </p>
                          <p className="text-xs font-black text-slate-600 dark:text-slate-400">
                            {report.status === "pending"
                              ? `Due ${formatDate(report.dueDate)}`
                              : `Submitted ${formatDate(report.submittedAt)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {(report.fileUrl || report.description) &&
                            report.status !== "pending" && (
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => {
                                  setSelectedReport(report)
                                }}
                                className="h-12 gap-2 rounded-xl border-slate-100 px-6 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                            )}
                          {report.fileUrl && report.fileType !== "link" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(report.fileUrl, "_blank")}
                              className="h-12 w-12 rounded-xl hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {report.fileUrl && report.fileType === "link" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(report.fileUrl, "_blank")}
                              className="h-12 w-12 rounded-xl hover:bg-blue-50 hover:text-blue-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          {report.status === "pending" && (
                            <Button
                              size="lg"
                              onClick={() => {
                                setShowSubmitModal(true)
                              }}
                              className="h-12 gap-2 rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                            >
                              <Upload className="h-4 w-4" />
                              Submit Now
                            </Button>
                          )}

                          {/* More actions dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-12 w-12 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  handleReplaceReport(report)
                                }}
                                className="gap-3 rounded-lg py-2"
                              >
                                <Upload className="h-4 w-4 text-blue-600" />
                                <span className="font-bold">Replace Report</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={async () => handleDeleteReport(report._id)}
                                className="gap-3 rounded-lg py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <X className="h-4 w-4" />
                                <span className="font-bold">Delete Report</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════════════ */}
      {deleteConfirm.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md"
          onClick={() => {
            setDeleteConfirm({ show: false, reportId: null, loading: false })
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase">Delete Report?</h3>
                <p className="mt-2 text-sm text-slate-500">
                  This action cannot be undone. The report will be permanently deleted from your
                  workspace.
                </p>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-100 p-6 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteConfirm({ show: false, reportId: null, loading: false })
                }}
                disabled={deleteConfirm.loading}
                className="h-12 flex-1 rounded-xl text-[10px] font-black tracking-widest uppercase"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleteConfirm.loading}
                className="h-12 flex-1 gap-2 rounded-xl bg-red-600 text-[10px] font-black tracking-widest text-white uppercase hover:bg-red-700"
              >
                {deleteConfirm.loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {deleteConfirm.loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SUBMIT MODAL
      ══════════════════════════════════════════════════ */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                  {replaceReport ? <Upload className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">
                    {replaceReport ? "Replace Report" : "Submit Report"}
                  </h2>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {replaceReport
                      ? "Update your report"
                      : `Week ${currentWeek} — Performance Archiving`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-5 p-6">
              {/* Tabs */}
              <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                {(
                  [
                    ["upload", "Upload File", <Upload key="u" className="h-3.5 w-3.5" />],
                    ["link", "Link", <Link2 key="l" className="h-3.5 w-3.5" />],
                    ["generate", "From Tasks", <Sparkles key="g" className="h-3.5 w-3.5" />]
                  ] as const
                )
                  .filter(([tab]) => !replaceReport || tab === "upload")
                  .map(([tab, label, icon]) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setModalTab(tab)
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black tracking-widest uppercase transition-all",
                        modalTab === tab
                          ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Report Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Execution Report — Engineering"
                  value={reportTitle}
                  onChange={(e) => {
                    setReportTitle(e.target.value)
                  }}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                />
              </div>

              {/* ── Upload tab ── */}
              {modalTab === "upload" && (
                <div className="space-y-3">
                  {!file ? (
                    <div
                      ref={dragRef}
                      onDragOver={(e) => {
                        e.preventDefault()
                        dragRef.current?.classList.add("ring-2", "ring-blue-500")
                      }}
                      onDragLeave={() =>
                        dragRef.current?.classList.remove("ring-2", "ring-blue-500")
                      }
                      onDrop={(e) => {
                        e.preventDefault()
                        dragRef.current?.classList.remove("ring-2", "ring-blue-500")
                        const f = e.dataTransfer.files?.[0]
                        if (f) {
                          handleFileSelect(f)
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Drop your report file here
                        </p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                        <p className="mt-1 text-xs text-slate-400">
                          PDF, PPT, DOC, DOCX, XLS, TXT — max 100 MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null)
                          setUploadError(null)
                        }}
                        disabled={uploading}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 disabled:pointer-events-none"
                      >
                        Change
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.md"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) {
                        handleFileSelect(f)
                      }
                    }}
                  />
                </div>
              )}

              {/* ── Link tab ── */}
              {modalTab === "link" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Report URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/... or any link"
                    value={reportUrl}
                    onChange={(e) => {
                      setReportUrl(e.target.value)
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              )}

              {/* ── Generate tab ── */}
              {modalTab === "generate" && (
                <div className="space-y-3">
                  {!generatedData ? (
                    <button
                      onClick={handleGenerateTasks}
                      disabled={generating}
                      className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 p-6 font-bold text-purple-600 transition-all hover:bg-purple-100 disabled:opacity-60 dark:border-purple-800 dark:bg-purple-900/10"
                    >
                      {generating ? (
                        <>
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-300 border-t-purple-600" />
                          Fetching your tasks...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          Generate Report from My Tasks
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            Icon: CircleCheck,
                            label: "Done",
                            count: generatedData.stats.done,
                            cls: "text-green-600 bg-green-50 dark:bg-green-900/20"
                          },
                          {
                            Icon: CircleDot,
                            label: "In Progress",
                            count: generatedData.stats.inProgress,
                            cls: "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          },
                          {
                            Icon: Circle,
                            label: "Todo",
                            count: generatedData.stats.todo,
                            cls: "text-slate-500 bg-slate-100 dark:bg-slate-800"
                          }
                        ].map(({ Icon, label, count, cls }) => (
                          <div
                            key={label}
                            className={cn("flex flex-col items-center gap-1 rounded-xl p-3", cls)}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="text-xl font-black">{count}</span>
                            <span className="text-[9px] font-black tracking-widest uppercase">
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Task preview */}
                      <div className="max-h-36 space-y-1 overflow-y-auto">
                        {generatedData.tasks.done.slice(0, 3).map((t) => (
                          <div
                            key={t._id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
                          >
                            <CircleCheck className="h-3 w-3 shrink-0 text-green-500" />
                            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                              {t.title}
                            </span>
                            {t.project && (
                              <span className="ml-auto shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold dark:bg-slate-700">
                                {t.project}
                              </span>
                            )}
                          </div>
                        ))}
                        {generatedData.tasks.inProgress.slice(0, 2).map((t) => (
                          <div
                            key={t._id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs"
                          >
                            <CircleDot className="h-3 w-3 shrink-0 text-blue-500" />
                            <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                              {t.title}
                            </span>
                            {t.project && (
                              <span className="ml-auto shrink-0 rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold dark:bg-slate-700">
                                {t.project}
                              </span>
                            )}
                          </div>
                        ))}
                        {generatedData.stats.total > 5 && (
                          <p className="px-2 text-[10px] text-slate-400">
                            +{generatedData.stats.total - 5} more tasks included
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setGeneratedData(null)
                        }}
                        className="w-full rounded-xl py-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase hover:text-red-500"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Notes / Context
                </label>
                <textarea
                  placeholder="Key takeaways or highlights..."
                  value={reportDescription}
                  onChange={(e) => {
                    setReportDescription(e.target.value)
                  }}
                  className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                />
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                    <span className="text-slate-400">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              {/* Error */}
              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="ghost"
                  onClick={closeModal}
                  disabled={uploading}
                  className="h-12 flex-1 rounded-xl text-[9px] font-black tracking-widest uppercase"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  disabled={
                    uploading ||
                    !reportTitle.trim() ||
                    (modalTab === "upload" && !file) ||
                    (modalTab === "link" && !reportUrl.trim()) ||
                    (modalTab === "generate" && !generatedData)
                  }
                  className="h-12 flex-2 gap-2 rounded-xl bg-slate-900 text-[9px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-300/30 dark:border-t-slate-900" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {replaceReport ? "Replace Report" : "Submit Report"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════ */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-md"
          onClick={() => {
            setSelectedReport(null)
          }}
        >
          <div
            className="w-full max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white/95 p-10 shadow-2xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {/* View header */}
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-8 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  {getFileIcon(selectedReport.fileType)}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight uppercase">
                    {selectedReport.title}
                  </h2>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    {selectedReport.submittedBy.name} — {formatDate(selectedReport.submittedAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null)
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {[
                  { label: "Week", value: `Week ${selectedReport.weekNumber}`, Icon: Calendar },
                  { label: "Status", value: selectedReport.status, Icon: Shield, badge: true },
                  {
                    label: "Type",
                    value: selectedReport.fileType?.toUpperCase() ?? "—",
                    Icon: FileText
                  },
                  { label: "Size", value: selectedReport.fileSize ?? "—", Icon: Zap }
                ].map(({ label, value, Icon, badge }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center gap-2 opacity-40">
                      <Icon className="h-3 w-3" />
                      <span className="text-[9px] font-black tracking-widest uppercase">
                        {label}
                      </span>
                    </div>
                    {badge ? (
                      <StatusBadge
                        type="custom"
                        value={value}
                        size="sm"
                        className="font-black tracking-widest uppercase"
                      />
                    ) : (
                      <p className="text-xs font-black tracking-tight uppercase">{value}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Notes / summary */}
              {selectedReport.description && (
                <div className="rounded-4xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="mb-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Notes / Summary
                  </p>
                  <pre className="max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                    {selectedReport.description}
                  </pre>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-2">
                {selectedReport.fileUrl ? (
                  <>
                    <Button
                      onClick={() => window.open(selectedReport.fileUrl, "_blank")}
                      className="h-14 flex-2 gap-3 rounded-2xl bg-blue-600 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                    >
                      <ExternalLink className="h-5 w-5" />
                      {selectedReport.fileType === "link" ? "Open Link" : "Open File"}
                    </Button>
                    {selectedReport.fileType !== "link" && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedReport.fileUrl, "_blank")}
                        className="h-14 flex-1 gap-3 rounded-2xl border-slate-200 text-[11px] font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="py-4 text-sm font-medium text-slate-400 italic">
                    This is a generated report — content is shown in the notes above.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
