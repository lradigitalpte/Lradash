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
  TrendingUp
} from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Report {
  id: string
  title: string
  submittedBy: string
  submittedByEmail: string
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

  // Mock data - replace with actual data
  const currentUser = {
    name: "John Doe",
    email: "john@example.com",
    role: "admin" // or "user"
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

  // Mock reports data
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      title: "Weekly Progress Report - Week 5",
      submittedBy: "John Doe",
      submittedByEmail: "john@example.com",
      submittedAt: new Date("2026-02-03T10:30:00"),
      dueDate: new Date("2026-02-03T23:59:59"),
      weekNumber: 5,
      year: 2026,
      status: "submitted",
      fileType: "ppt",
      fileUrl: "https://example.com/report.pptx",
      fileName: "Week5_Progress.pptx",
      fileSize: "2.4 MB",
      description: "Weekly progress update including completed tasks and upcoming milestones"
    },
    {
      id: "2",
      title: "Weekly Progress Report - Week 4",
      submittedBy: "Jane Smith",
      submittedByEmail: "jane@example.com",
      submittedAt: new Date("2026-01-27T14:20:00"),
      dueDate: new Date("2026-01-27T23:59:59"),
      weekNumber: 4,
      year: 2026,
      status: "submitted",
      fileType: "pdf",
      fileUrl: "https://example.com/report.pdf",
      fileName: "Week4_Report.pdf",
      fileSize: "1.8 MB"
    },
    {
      id: "3",
      title: "Weekly Progress Report - Week 3",
      submittedBy: "John Doe",
      submittedByEmail: "john@example.com",
      submittedAt: new Date("2026-01-22T16:45:00"),
      dueDate: new Date("2026-01-20T23:59:59"),
      weekNumber: 3,
      year: 2026,
      status: "overdue",
      fileType: "link",
      fileUrl: "https://docs.google.com/presentation/d/abc123",
      fileName: "Google Slides Link"
    },
    {
      id: "4",
      title: "Weekly Progress Report - Week 6",
      submittedBy: "Pending",
      submittedByEmail: "john@example.com",
      submittedAt: new Date(),
      dueDate: getNextMonday(),
      weekNumber: 6,
      year: 2026,
      status: "pending",
    }
  ])

  const nextDueDate = getNextMonday()
  const currentWeek = getWeekNumber(new Date())
  const daysUntilDue = Math.ceil((nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.submittedBy.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === "all" || report.status === filterStatus
      
      // Filter by user role
      if (currentUser.role !== "admin") {
        return matchesSearch && matchesStatus && report.submittedByEmail === currentUser.email
      }
      
      return matchesSearch && matchesStatus
    })
  }, [reports, searchTerm, filterStatus, currentUser])

  const stats = {
    submitted: reports.filter(r => r.status === "submitted").length,
    overdue: reports.filter(r => r.status === "overdue").length,
    pending: reports.filter(r => r.status === "pending").length,
    total: reports.length
  }

  const handleSubmitReport = () => {
    if (!newReport.title) return

    const newReportData: Report = {
      id: Date.now().toString(),
      title: newReport.title,
      submittedBy: currentUser.name,
      submittedByEmail: currentUser.email,
      submittedAt: new Date(),
      dueDate: nextDueDate,
      weekNumber: currentWeek,
      year: new Date().getFullYear(),
      status: "submitted",
      fileType: newReport.fileType,
      fileUrl: newReport.fileUrl,
      fileName: newReport.fileName || "Report File",
      description: newReport.description
    }

    setReports([newReportData, ...reports.filter(r => r.status !== "pending")])
    setShowSubmitModal(false)
    setNewReport({
      title: "",
      description: "",
      fileUrl: "",
      fileName: "",
      fileType: "link"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
      case "overdue":
        return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
      case "pending":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400"
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  const getFileIcon = (fileType?: string) => {
    switch (fileType) {
      case "ppt":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "pdf":
        return <FileText className="h-5 w-5 text-red-600" />
      case "doc":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "link":
        return <Link2 className="h-5 w-5 text-purple-600" />
      default:
        return <Paperclip className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Weekly Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Submit and track weekly progress reports
            </p>
          </div>
          <Button onClick={() => setShowSubmitModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Submit Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Next Deadline */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Next Deadline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {daysUntilDue} {daysUntilDue === 1 ? "Day" : "Days"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {nextDueDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                </p>
              </CardContent>
            </Card>

            {/* Submitted */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Submitted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.submitted}</div>
                <p className="text-xs text-muted-foreground mt-1">On time submissions</p>
              </CardContent>
            </Card>

            {/* Overdue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.overdue}</div>
                <p className="text-xs text-muted-foreground mt-1">Late submissions</p>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-yellow-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting submission</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Report History</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Filter className="h-4 w-4" />
                        {filterStatus === "all" ? "All Status" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                        All Status
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setFilterStatus("submitted")}>
                        Submitted
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus("overdue")}>
                        Overdue
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                        Pending
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredReports.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No reports found</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0">{getFileIcon(report.fileType)}</div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm truncate">{report.title}</h3>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Week {report.weekNumber}, {report.year}
                                </span>
                                <span>•</span>
                                <span>{report.submittedBy}</span>
                                {report.fileName && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <Paperclip className="h-3 w-3" />
                                      {report.fileName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {report.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {report.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-3">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              getStatusColor(report.status)
                            )}>
                              {report.status === "submitted" && <CheckCircle2 className="h-3 w-3" />}
                              {report.status === "overdue" && <AlertCircle className="h-3 w-3" />}
                              {report.status === "pending" && <Clock className="h-3 w-3" />}
                              {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                            </span>

                            {report.status === "submitted" || report.status === "overdue" ? (
                              <span className="text-xs text-muted-foreground">
                                Submitted {report.submittedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Due {report.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}

                            {report.fileSize && (
                              <span className="text-xs text-muted-foreground">
                                {report.fileSize}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {report.fileUrl && report.status !== "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedReport(report)}
                                className="gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(report.fileUrl, "_blank")}
                                className="gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open
                              </Button>
                            </>
                          )}
                          {report.status === "pending" && report.submittedByEmail === currentUser.email && (
                            <Button
                              size="sm"
                              onClick={() => setShowSubmitModal(true)}
                              className="gap-2"
                            >
                              <Upload className="h-4 w-4" />
                              Submit Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowSubmitModal(false)}>
          <Card className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Submit Weekly Report</CardTitle>
                  <CardDescription className="mt-1">
                    Week {currentWeek} • Due {nextDueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSubmitModal(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Report Title */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Report Title *</label>
                <Input
                  placeholder="e.g., Weekly Progress Report - Week 6"
                  value={newReport.title}
                  onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  placeholder="Brief summary of the report content..."
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  className="w-full min-h-[100px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {/* File Type Selection */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Submission Type *</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { type: "ppt", label: "PowerPoint", icon: FileText, color: "text-orange-600" },
                    { type: "pdf", label: "PDF", icon: FileText, color: "text-red-600" },
                    { type: "doc", label: "Document", icon: FileText, color: "text-blue-600" },
                    { type: "link", label: "Link", icon: Link2, color: "text-purple-600" }
                  ].map((option) => (
                    <button
                      key={option.type}
                      onClick={() => setNewReport({ ...newReport, fileType: option.type as any })}
                      className={cn(
                        "border-2 rounded-lg p-4 text-center transition-all hover:border-primary/50",
                        newReport.fileType === option.type
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                    >
                      <div className="mb-2 flex justify-center">
                        <option.icon className={cn("h-8 w-8", option.color)} />
                      </div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* File/Link Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">
                  {newReport.fileType === "link" ? "Report Link *" : "File Name *"}
                </label>
                {newReport.fileType === "link" ? (
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={newReport.fileUrl}
                    onChange={(e) => setNewReport({ ...newReport, fileUrl: e.target.value })}
                  />
                ) : (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      type="file"
                      accept={
                        newReport.fileType === "ppt"
                          ? ".ppt,.pptx"
                          : newReport.fileType === "pdf"
                          ? ".pdf"
                          : ".doc,.docx"
                      }
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setNewReport({
                            ...newReport,
                            fileName: file.name,
                            fileUrl: URL.createObjectURL(file)
                          })
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button variant="outline" size="sm" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                    {newReport.fileName && (
                      <p className="text-sm text-primary mt-2">
                        Selected: {newReport.fileName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReport}
                  disabled={!newReport.title || (!newReport.fileUrl && !newReport.fileName)}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <Card className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedReport.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Submitted by {selectedReport.submittedBy} on {selectedReport.submittedAt.toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedReport(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Week:</span>
                  <span className="ml-2 font-medium">Week {selectedReport.weekNumber}, {selectedReport.year}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <span className={cn(
                    "ml-2 px-2 py-0.5 rounded-full text-xs font-medium",
                    getStatusColor(selectedReport.status)
                  )}>
                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">File Type:</span>
                  <span className="ml-2 font-medium">{selectedReport.fileType?.toUpperCase()}</span>
                </div>
                {selectedReport.fileSize && (
                  <div>
                    <span className="text-muted-foreground">File Size:</span>
                    <span className="ml-2 font-medium">{selectedReport.fileSize}</span>
                  </div>
                )}
              </div>

              {selectedReport.description && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  onClick={() => window.open(selectedReport.fileUrl, "_blank")}
                  className="flex-1 gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Report
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
