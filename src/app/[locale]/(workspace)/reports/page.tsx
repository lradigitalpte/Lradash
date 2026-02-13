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
  ArrowRight,
  Shield
} from "lucide-react"
import { useState, useMemo, useEffect } from "react"
import { toast } from "sonner"

import { StatCard, StatusBadge, UserAvatar } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { cn, formatDate } from "@/lib/utils"

interface Report {
  _id: string
  title: string
  submittedBy: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  submittedAt: Date
  dueDate: Date
  weekNumber: number
  year: number
  status: "submitted" | "overdue" | "pending"
  fileType?: "ppt" | "pdf" | "doc" | "link"
  fileUrl?: string
  fileName?: string
  fileSize?: string
  description?: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [newReport, setNewReport] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileName: "",
    fileType: "link" as "ppt" | "pdf" | "doc" | "link"
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/api/reports")
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast.error("Failed to load reports")
    } finally {
      setLoading(false)
    }
  }

  // Calculate week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Get next Monday
  const getNextMonday = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek
    const nextMonday = new Date(today)
    nextMonday.setDate(today.getDate() + daysUntilMonday)
    nextMonday.setHours(23, 59, 59, 999)
    return nextMonday
  }

  const nextDueDate = getNextMonday()
  const currentWeek = getWeekNumber(new Date())
  const daysUntilDue = Math.ceil(
    (nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.submittedBy.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || report.status === filterStatus

      return matchesSearch && matchesStatus
    })
  }, [reports, searchTerm, filterStatus])

  const reportStats = {
    submitted: reports.filter((r) => r.status === "submitted").length,
    overdue: reports.filter((r) => r.status === "overdue").length,
    pending: reports.filter((r) => r.status === "pending").length,
    total: reports.length
  }

  const handleSubmitReport = async () => {
    if (!newReport.title) {
      return
    }

    try {
      setLoading(true)
      const response = await apiClient.post("/api/reports", {
        ...newReport,
        dueDate: nextDueDate,
        weekNumber: currentWeek,
        year: new Date().getFullYear()
      })

      if (response.ok) {
        toast.success("Report successfully archived")
        setShowSubmitModal(false)
        setNewReport({
          title: "",
          description: "",
          fileUrl: "",
          fileName: "",
          fileType: "link"
        })
        fetchReports()
      } else {
        toast.error("Failed to submit report")
      }
    } catch (error) {
      console.error("Submit report error:", error)
      toast.error("An error occurred during submission")
    } finally {
      setLoading(false)
    }
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
      default:
        return <Paperclip className="h-6 w-6 text-slate-400" />
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-[500px] w-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-[1600px] space-y-12 p-8 lg:p-12">
        {/* WOW Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <FileText className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Reports Management
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                  Status Green
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Project{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reports
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                Archive and analyze project reports and progress across the team
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            <Button
              size="lg"
              onClick={() =>{  setShowSubmitModal(true); }}
              className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="h-5 w-5 stroke-[3]" />
              Submit Report
            </Button>
          </div>
        </div>

        {/* Performance Summary Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Submission Deadline"
            value={`${daysUntilDue} Days`}
            subtitle={nextDueDate.toLocaleDateString("en-US", { weekday: "long" })}
            icon={Clock}
            variant="primary"
          />
          <StatCard
            title="Submitted Reports"
            value={reportStats.submitted}
            subtitle="Reports submitted"
            icon={CheckCircle2}
            variant="success"
          />
          <StatCard
            title="Overdue Reports"
            value={reportStats.overdue}
            subtitle="Missed deadlines"
            icon={AlertCircle}
            variant="danger"
          />
          <StatCard
            title="Pending Reports"
            value={reportStats.pending}
            subtitle="Waiting for submission"
            icon={TrendingUp}
            variant="warning"
          />
        </div>

        {/* Reports List */}
        <div className="space-y-8">
          <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-2 md:flex-row md:items-center dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                <FileBarChart className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Report History</h2>
            </div>

            <div className="flex gap-3">
              <div className="group relative">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) =>{  setSearchTerm(e.target.value); }}
                  className="h-12 w-full rounded-2xl border border-slate-100 bg-white pr-6 pl-12 text-xs font-bold shadow-sm transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 md:w-64 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 text-[10px] font-black tracking-widest uppercase shadow-sm transition-all hover:shadow-md dark:bg-slate-950"
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
                  <DropdownMenuItem
                    onClick={() =>{  setFilterStatus("all"); }}
                    className="gap-3 rounded-xl py-3 font-bold"
                  >
                    All Reports
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>{  setFilterStatus("submitted"); }}
                    className="gap-3 rounded-xl py-3 font-bold text-emerald-600"
                  >
                    Submitted
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>{  setFilterStatus("overdue"); }}
                    className="gap-3 rounded-xl py-3 font-bold text-rose-600"
                  >
                    Overdue
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>{  setFilterStatus("pending"); }}
                    className="gap-3 rounded-xl py-3 font-bold text-amber-600"
                  >
                    Pending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid gap-6">
            {filteredReports.length === 0 ? (
              <Card className="rounded-[2.5rem] border-none bg-white/40 p-24 text-center backdrop-blur-xl dark:bg-slate-900/40">
                <FileBarChart className="mx-auto mb-6 h-16 w-16 text-slate-200" />
                <h3 className="text-2xl font-black tracking-tight text-slate-400 uppercase">
                  No reports found for this period
                </h3>
              </Card>
            ) : (
              filteredReports.map((report) => (
                <Card
                  key={report._id}
                  className="group overflow-hidden rounded-[2rem] border-none bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:bg-slate-900/60 dark:shadow-none"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                      <div className="flex flex-1 items-start gap-6">
                        <div className="mt-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shadow-inner transition-transform duration-500 group-hover:scale-110 dark:bg-slate-800">
                          {getFileIcon(report.fileType)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
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
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>
                                Week {report.weekNumber}, {report.year}
                              </span>
                            </div>
                            <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <div className="flex items-center gap-2">
                              <UserAvatar name={report.submittedBy.name} size="xs" />
                              <span>{report.submittedBy.name}</span>
                            </div>
                            {report.fileName && (
                              <>
                                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="flex items-center gap-2">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  <span>{report.fileName}</span>
                                </div>
                              </>
                            )}
                          </div>
                          {report.description && (
                            <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                              {report.description}
                            </p>
                          )}
                        </div>
                      </div>

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
                          {report.fileUrl && report.status !== "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() =>{  setSelectedReport(report); }}
                                className="h-12 gap-2 rounded-xl border-slate-100 px-6 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(report.fileUrl, "_blank")}
                                className="h-12 w-12 rounded-xl hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {report.status === "pending" && (
                            <Button
                              size="lg"
                              onClick={() =>{  setShowSubmitModal(true); }}
                              className="h-12 gap-2 rounded-xl bg-blue-600 px-8 text-[10px] font-black tracking-widest text-white uppercase shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:bg-blue-700"
                            >
                              <Upload className="h-4 w-4" />
                              Submit Now
                            </Button>
                          )}
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

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md"
          onClick={() =>{  setShowSubmitModal(false); }}
        >
          <Card
            className="w-full max-w-xl rounded-3xl border-none bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(e) =>{  e.stopPropagation(); }}
          >
            <CardHeader className="mb-6 p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black tracking-tight uppercase">
                      Submit Report
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                      Week {currentWeek} • Performance Archiving
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>{  setShowSubmitModal(false); }}
                  className="h-10 w-10 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Report Headline
                </label>
                <Input
                  placeholder="e.g. Weekly Execution Report - Engineering"
                  value={newReport.title}
                  onChange={(e) =>{  setNewReport({ ...newReport, title: e.target.value }); }}
                  className="h-12 rounded-xl border-none bg-slate-50 font-bold placeholder:text-slate-300 dark:bg-slate-800/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Access Type
                  </label>
                  <div className="flex rounded-xl bg-slate-50 p-1 dark:bg-slate-800/50">
                    <button
                      onClick={() =>{  setNewReport({ ...newReport, fileType: "link" }); }}
                      className={cn(
                        "h-10 flex-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all",
                        newReport.fileType === "link"
                          ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                          : "text-slate-400"
                      )}
                    >
                      {" "}
                      Link{" "}
                    </button>
                    <button
                      onClick={() =>{  setNewReport({ ...newReport, fileType: "pdf" }); }}
                      className={cn(
                        "h-10 flex-1 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all",
                        newReport.fileType !== "link"
                          ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700"
                          : "text-slate-400"
                      )}
                    >
                      {" "}
                      File{" "}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    File Reference
                  </label>
                  <Input
                    placeholder={newReport.fileType === "link" ? "Enter URL" : "Enter Filename"}
                    value={newReport.fileType === "link" ? newReport.fileUrl : newReport.fileName}
                    onChange={(e) => {
                      if (newReport.fileType === "link") {
                        setNewReport({
                          ...newReport,
                          fileUrl: e.target.value,
                          fileName: "External Link"
                        })
                      } else {
                        setNewReport({
                          ...newReport,
                          fileName: e.target.value,
                          fileUrl: "local_upload"
                        })
                      }
                    }}
                    className="h-12 rounded-xl border-none bg-slate-50 font-bold dark:bg-slate-800/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Context/Notes
                </label>
                <textarea
                  placeholder="Key takeaways or important highlights..."
                  value={newReport.description}
                  onChange={(e) =>{  setNewReport({ ...newReport, description: e.target.value }); }}
                  className="h-24 w-full resize-none rounded-xl border-none bg-slate-50 p-4 font-bold shadow-inner placeholder:text-slate-300 dark:bg-slate-800/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() =>{  setShowSubmitModal(false); }}
                  className="h-12 flex-1 rounded-xl text-[9px] font-black tracking-widest text-slate-400 uppercase hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  disabled={
                    !newReport.title || (!newReport.fileUrl && !newReport.fileName) || loading
                  }
                  className="h-12 flex-[2] gap-2 rounded-xl bg-slate-900 text-[9px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Submit Data
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* View Report Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-md"
          onClick={() =>{  setSelectedReport(null); }}
        >
          <Card
            className="w-full max-w-3xl rounded-[2.5rem] border-none bg-white/90 p-10 shadow-2xl backdrop-blur-2xl dark:bg-slate-900/90"
            onClick={(e) =>{  e.stopPropagation(); }}
          >
            <CardHeader className="mb-8 border-b border-slate-100 p-0 pb-8 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {getFileIcon(selectedReport.fileType)}
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">
                      {selectedReport.title}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                      Submitted by {selectedReport.submittedBy.name} •{" "}
                      {formatDate(selectedReport.submittedAt)}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>{  setSelectedReport(null); }}
                  className="h-12 w-12 rounded-full transition-colors hover:bg-slate-100"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </CardHeader>
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {[
                  {
                    label: "Week Number",
                    value: `Week ${selectedReport.weekNumber}`,
                    icon: Calendar
                  },
                  {
                    label: "Report Status",
                    value: selectedReport.status,
                    icon: Shield,
                    isBadge: true
                  },
                  {
                    label: "File Type",
                    value: selectedReport.fileType?.toUpperCase(),
                    icon: FileText
                  },
                  { label: "File Size", value: selectedReport.fileSize || "N/A", icon: Zap }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2 opacity-40">
                      <item.icon className="h-3 w-3" />
                      <span className="text-[9px] font-black tracking-widest uppercase">
                        {item.label}
                      </span>
                    </div>
                    {item.isBadge ? (
                      <StatusBadge
                        type="custom"
                        value={item.value}
                        size="sm"
                        className="font-black tracking-widest uppercase"
                      />
                    ) : (
                      <p className="text-xs font-black tracking-tight uppercase">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>

              {selectedReport.description && (
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-800/50">
                  <h4 className="mb-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Summary
                  </h4>
                  <p className="text-sm leading-relaxed font-medium text-slate-600 italic dark:text-slate-400">
                    "{selectedReport.description}"
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => window.open(selectedReport.fileUrl, "_blank")}
                  className="h-16 flex-[2] gap-3 rounded-2xl bg-blue-600 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-blue-500/20 hover:bg-blue-700"
                >
                  <ExternalLink className="h-5 w-5" />
                  Open Report
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex-1 gap-3 rounded-2xl border-slate-200 text-[11px] font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white"
                >
                  <Download className="h-5 w-5" />
                  Download
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
