"use client"

import {
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileBarChart,
  FileCode,
  FileText,
  Filter,
  Link2,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Upload,
  X,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
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

interface Minutes {
  _id: string
  title: string
  description?: string
  meetingDate?: Date | string | null
  submittedBy: { id: string; name: string; email?: string; avatar?: string }
  submittedAt: Date | string
  fileType?: "ppt" | "pdf" | "doc" | "txt" | "md" | "xls" | "link"
  fileUrl?: string
  fileName?: string
  fileSize?: string
}

type ModalTab = "upload" | "link"

const MAX_SIZE = 100 * 1024 * 1024

interface DeleteConfirmState {
  show: boolean
  minutesId: string | null
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

function safeUserId(): string | null {
  try {
    const stored = localStorage.getItem("user")
    if (!stored) {
      return null
    }
    const parsed = JSON.parse(stored) as { id?: string }
    return parsed?.id ?? null
  } catch {
    return null
  }
}

export default function MinutesPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? "en"

  const [minutes, setMinutes] = useState<Minutes[]>([])
  const [loading, setLoading] = useState(true)

  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [modalTab, setModalTab] = useState<ModalTab>("upload")
  const [selectedMinutes, setSelectedMinutes] = useState<Minutes | null>(null)
  const [replaceMinutes, setReplaceMinutes] = useState<Minutes | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")

  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>({
    show: false,
    minutesId: null,
    loading: false
  })

  // Upload state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)

  // Form fields
  const [minutesTitle, setMinutesTitle] = useState("")
  const [minutesDescription, setMinutesDescription] = useState("")
  const [minutesUrl, setMinutesUrl] = useState("")
  const [meetingDate, setMeetingDate] = useState<string>("")

  useEffect(() => {
    fetchMinutes()
  }, [])

  const fetchMinutes = async () => {
    try {
      setLoading(true)
      const res = await apiClient.get("/api/minutes")
      if (res.ok) {
        setMinutes(await res.json())
      } else {
        toast.error("Failed to load minutes")
      }
    } catch {
      toast.error("Failed to load minutes")
    } finally {
      setLoading(false)
    }
  }

  const currentUserId = typeof window === "undefined" ? null : safeUserId()

  const canEdit = (m: Minutes) =>
    !!currentUserId && String(m.submittedBy.id) === String(currentUserId)

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
    if (!minutesTitle) {
      setMinutesTitle(f.name.replace(/\.[^/.]+$/, ""))
    }
  }

  const uploadToS3 = async (f: File) => {
    setUploadProgress(10)
    const res = await apiClient.post("/api/upload/presigned", {
      fileName: f.name,
      fileType: f.type || "application/octet-stream",
      folder: "minutes"
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
      default:
        return <Paperclip className="h-6 w-6 text-slate-400" />
    }
  }

  const closeModal = () => {
    setShowSubmitModal(false)
    setFile(null)
    setUploadError(null)
    setUploadProgress(0)
    setMinutesTitle("")
    setMinutesDescription("")
    setMinutesUrl("")
    setMeetingDate("")
    setModalTab("upload")
    setReplaceMinutes(null)
  }

  const handleReplaceMinutes = (m: Minutes) => {
    setReplaceMinutes(m)
    setMinutesTitle(m.title)
    setMinutesDescription(m.description || "")
    setMeetingDate(m.meetingDate ? String(m.meetingDate).slice(0, 10) : "")
    setShowSubmitModal(true)
    setModalTab(m.fileType === "link" ? "link" : "upload")
  }

  const handleSubmitMinutes = async () => {
    if (!minutesTitle.trim()) {
      toast.error("Title is required")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    try {
      let payload: Record<string, unknown> = {
        title: minutesTitle,
        description: minutesDescription,
        meetingDate: meetingDate ? new Date(meetingDate).toISOString() : null
      }

      if (modalTab === "upload") {
        if (!file) {
          toast.error("Please select a file")
          setUploading(false)
          return
        }
        const { publicUrl, fileSize } = await uploadToS3(file)
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "doc"
        const type =
          ext === "pdf"
            ? "pdf"
            : ["ppt", "pptx"].includes(ext)
              ? "ppt"
              : ["txt"].includes(ext)
                ? "txt"
                : ["md"].includes(ext)
                  ? "md"
                  : ["xls", "xlsx"].includes(ext)
                    ? "xls"
                    : "doc"
        payload = {
          ...payload,
          fileUrl: publicUrl,
          fileName: file.name,
          fileType: type,
          fileSize
        }
      } else {
        if (!minutesUrl.trim()) {
          toast.error("Please enter a URL")
          setUploading(false)
          return
        }
        payload = {
          ...payload,
          fileUrl: minutesUrl,
          fileName: "External Link",
          fileType: "link"
        }
      }

      setUploadProgress(92)

      if (replaceMinutes) {
        const res = await apiClient.put(`/api/minutes/${replaceMinutes._id}`, payload)
        if (!res.ok) {
          throw new Error("Failed to update minutes")
        }
      } else {
        const res = await apiClient.post("/api/minutes", payload)
        if (!res.ok) {
          throw new Error("Failed to save minutes")
        }
      }

      setUploadProgress(100)
      toast.success(replaceMinutes ? "Minutes updated!" : "Minutes submitted!")
      closeModal()
      fetchMinutes()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed"
      setUploadError(msg)
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteMinutes = async (minutesId: string) => {
    setDeleteConfirm({ show: true, minutesId, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.minutesId) {
      return
    }
    setDeleteConfirm((prev) => ({ ...prev, loading: true }))
    try {
      const res = await apiClient.delete(`/api/minutes/${deleteConfirm.minutesId}`)
      if (!res.ok) {
        throw new Error("Failed to delete minutes")
      }
      toast.success("Minutes deleted successfully")
      setDeleteConfirm({ show: false, minutesId: null, loading: false })
      fetchMinutes()
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to delete minutes"
      toast.error(msg)
      setDeleteConfirm((prev) => ({ ...prev, loading: false }))
    }
  }

  const filteredMinutes = useMemo(() => {
    return minutes.filter((m) => {
      const q = searchTerm.toLowerCase()
      const matchSearch =
        m.title.toLowerCase().includes(q) ||
        (m.submittedBy?.name ?? "").toLowerCase().includes(q) ||
        (m.submittedBy?.email ?? "").toLowerCase().includes(q)
      const matchType = filterType === "all" || (m.fileType ?? "doc") === filterType
      return matchSearch && matchType
    })
  }, [minutes, searchTerm, filterType])

  const stats = {
    total: minutes.length,
    thisMonth: minutes.filter((m) => {
      const d = m.meetingDate ? new Date(m.meetingDate) : new Date(m.submittedAt)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length,
    mine: minutes.filter((m) => canEdit(m)).length
  }

  return (
    <div className="relative min-h-full overflow-hidden pb-32">
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-150 w-150 rounded-full bg-indigo-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-125 w-125 rounded-full bg-blue-500/5 blur-[120px]" />

      <div className="mx-auto max-w-400 space-y-12 p-8 lg:p-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-linear-to-r from-indigo-600 to-purple-700 opacity-20 blur transition duration-1000 group-hover:opacity-40" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-indigo-600 to-purple-700 text-white shadow-2xl shadow-indigo-500/30">
                <FileText className="h-10 w-10" />
              </div>
            </div>
            <div className="space-y-2">
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                Knowledge Base
              </span>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Submit{" "}
                <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Minutes
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic dark:text-slate-400">
                Org-wide meeting minutes — everyone can view
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 pb-2">
            <Link href={`/${locale}/reports`}>
              <Button
                variant="outline"
                size="lg"
                className="h-14 gap-2 rounded-2xl border-slate-200 px-6 text-sm font-black tracking-widest uppercase shadow-sm hover:shadow-md dark:border-slate-700"
              >
                <FileText className="h-4 w-4" />
                Reports
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={() => {
                setShowSubmitModal(true)
              }}
              className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
            >
              <div className="absolute inset-0 bg-linear-to-r from-indigo-600/20 to-purple-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
              <Plus className="h-5 w-5" />
              Submit Minutes
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Minutes"
            value={stats.total}
            subtitle="Across the org"
            icon={FileText}
            variant="primary"
          />
          <StatCard
            title="This Month"
            value={stats.thisMonth}
            subtitle="Recent activity"
            icon={Calendar}
            variant="success"
          />
          <StatCard
            title="My Submissions"
            value={stats.mine}
            subtitle="Editable by you"
            icon={CheckCircle2}
            variant="warning"
          />
          <StatCard
            title="Visibility"
            value="Global"
            subtitle="All members"
            icon={StatusBadge as any}
            variant="danger"
          />
        </div>

        {/* List */}
        <div className="space-y-8">
          <div className="flex flex-col justify-between gap-6 border-b border-slate-100 pb-2 md:flex-row md:items-center dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                <FileBarChart className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight uppercase">Minutes History</h2>
            </div>
            <div className="flex gap-3">
              <div className="group relative">
                <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search minutes..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-100 bg-white pr-6 pl-12 text-xs font-bold shadow-sm placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none md:w-64 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 gap-2 rounded-2xl border-slate-100 bg-white px-6 text-[10px] font-black tracking-widest uppercase shadow-sm dark:bg-slate-950"
                  >
                    <Filter className="h-4 w-4 text-indigo-600" />
                    Type:{" "}
                    <span className="text-indigo-600">
                      {filterType === "all" ? "All" : filterType}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                >
                  <DropdownMenuLabel className="p-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Filter Type
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(
                    [
                      ["all", "All"],
                      ["pdf", "PDF"],
                      ["ppt", "PPT"],
                      ["doc", "DOC"],
                      ["txt", "TXT"],
                      ["md", "MD"],
                      ["xls", "XLS"],
                      ["link", "Link"]
                    ] as const
                  ).map(([v, l]) => (
                    <DropdownMenuItem
                      key={v}
                      onClick={() => {
                        setFilterType(v)
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

          <div className="grid gap-6">
            {loading ? (
              <div className="py-24 text-center text-sm font-bold text-slate-400">Loading...</div>
            ) : filteredMinutes.length === 0 ? (
              <Card className="rounded-[2.5rem] border-none bg-white/40 p-24 text-center backdrop-blur-xl dark:bg-slate-900/40">
                <FileBarChart className="mx-auto mb-6 h-16 w-16 text-slate-200" />
                <h3 className="text-2xl font-black tracking-tight text-slate-400 uppercase">
                  No minutes found
                </h3>
                <p className="mt-2 text-sm text-slate-400">Submit your first minutes above</p>
              </Card>
            ) : (
              filteredMinutes.map((m) => (
                <Card
                  key={m._id}
                  className="group overflow-hidden rounded-4xl border-none bg-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:bg-slate-900/60"
                >
                  <CardContent className="p-8">
                    <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                      <div className="flex flex-1 items-start gap-6">
                        <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50 shadow-inner transition-transform duration-500 group-hover:scale-110 dark:bg-slate-800">
                          {getFileIcon(m.fileType)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-black tracking-tight text-slate-900 uppercase transition-colors group-hover:text-indigo-600 dark:text-white">
                              {m.title}
                            </h3>
                            <span className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black tracking-widest text-slate-600 uppercase dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                              {m.fileType ?? "doc"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {m.meetingDate
                                ? `Meeting ${formatDate(new Date(m.meetingDate))}`
                                : `Submitted ${formatDate(new Date(m.submittedAt))}`}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                            <span className="flex items-center gap-1.5">
                              <UserAvatar
                                name={m.submittedBy.name}
                                image={m.submittedBy.avatar}
                                size="xs"
                              />
                              {m.submittedBy.name}
                            </span>
                            {m.fileName && (
                              <>
                                <span className="h-1 w-1 rounded-full bg-slate-200" />
                                <span className="flex items-center gap-1.5">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  {m.fileName}
                                </span>
                              </>
                            )}
                          </div>
                          {m.description && (
                            <p className="line-clamp-1 text-xs font-medium text-slate-500 italic">
                              {m.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 border-slate-100 lg:border-l lg:pl-8 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          {(m.fileUrl || m.description) && (
                            <Button
                              variant="outline"
                              size="lg"
                              onClick={() => {
                                setSelectedMinutes(m)
                              }}
                              className="h-12 gap-2 rounded-xl border-slate-100 px-6 text-[10px] font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900"
                            >
                              View
                            </Button>
                          )}
                          {m.fileUrl && m.fileType !== "link" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(m.fileUrl, "_blank")}
                              className="h-12 w-12 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {m.fileUrl && m.fileType === "link" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(m.fileUrl, "_blank")}
                              className="h-12 w-12 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}

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
                            <DropdownMenuContent align="end" className="w-52 rounded-2xl">
                              <DropdownMenuLabel className="px-3 py-2 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                Actions
                              </DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {canEdit(m) ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      handleReplaceMinutes(m)
                                    }}
                                    className="gap-3 rounded-lg py-2"
                                  >
                                    <Upload className="h-4 w-4 text-indigo-600" />
                                    <span className="font-bold">Edit / Replace</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={async () => handleDeleteMinutes(m._id)}
                                    className="gap-3 rounded-lg py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="font-bold">Delete</span>
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem
                                  className="rounded-lg py-2 text-slate-500"
                                  disabled
                                >
                                  Only the author can edit/delete
                                </DropdownMenuItem>
                              )}
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

      {/* Delete confirm */}
      {deleteConfirm.show && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-md"
          onClick={() => {
            setDeleteConfirm({ show: false, minutesId: null, loading: false })
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
                <h3 className="text-2xl font-black tracking-tight uppercase">Delete minutes?</h3>
                <p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 p-6 dark:border-slate-800">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteConfirm({ show: false, minutesId: null, loading: false })
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

      {/* Submit modal */}
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
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  {replaceMinutes ? (
                    <Upload className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight uppercase">
                    {replaceMinutes ? "Update Minutes" : "Submit Minutes"}
                  </h2>
                  <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Org-wide visibility · author-only edits
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

            <div className="space-y-5 p-6">
              <div className="flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                {(
                  [
                    ["upload", "Upload File", <Upload key="u" className="h-3.5 w-3.5" />],
                    ["link", "Link", <Link2 key="l" className="h-3.5 w-3.5" />]
                  ] as const
                )
                  .filter(([tab]) => !replaceMinutes || tab === modalTab)
                  .map(([tab, label, icon]) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setModalTab(tab)
                      }}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black tracking-widest uppercase transition-all",
                        modalTab === tab
                          ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400"
                          : "text-slate-400 hover:text-slate-600"
                      )}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Meeting date (optional)
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => {
                      setMeetingDate(e.target.value)
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sprint Planning Minutes"
                    value={minutesTitle}
                    onChange={(e) => {
                      setMinutesTitle(e.target.value)
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              </div>

              {modalTab === "upload" && (
                <div className="space-y-3">
                  {!file ? (
                    <div
                      ref={dragRef}
                      onDragOver={(e) => {
                        e.preventDefault()
                        dragRef.current?.classList.add("ring-2", "ring-indigo-500")
                      }}
                      onDragLeave={() =>
                        dragRef.current?.classList.remove("ring-2", "ring-indigo-500")
                      }
                      onDrop={(e) => {
                        e.preventDefault()
                        dragRef.current?.classList.remove("ring-2", "ring-indigo-500")
                        const f = e.dataTransfer.files?.[0]
                        if (f) {
                          handleFileSelect(f)
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/20"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                        <Upload className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">
                          Drop your file here
                        </p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                        <p className="mt-1 text-xs text-slate-400">
                          PDF, PPT, DOC, DOCX, XLS, TXT, MD — max 100 MB
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

              {modalTab === "link" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Minutes URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/... or any link"
                    value={minutesUrl}
                    onChange={(e) => {
                      setMinutesUrl(e.target.value)
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 font-bold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Notes / Context
                </label>
                <textarea
                  placeholder="Agenda, decisions, action items..."
                  value={minutesDescription}
                  onChange={(e) => {
                    setMinutesDescription(e.target.value)
                  }}
                  className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300"
                />
              </div>

              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                    <span className="text-slate-400">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5" />
                </div>
              )}

              {uploadError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/30 dark:bg-red-900/10">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {uploadError}
                </div>
              )}

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
                  onClick={handleSubmitMinutes}
                  disabled={
                    uploading ||
                    !minutesTitle.trim() ||
                    (modalTab === "upload" && !file) ||
                    (modalTab === "link" && !minutesUrl.trim())
                  }
                  className="h-12 flex-2 gap-2 rounded-xl bg-slate-900 text-[9px] font-black tracking-widest text-white uppercase shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
                >
                  {uploading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-300/30 dark:border-t-slate-900" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {replaceMinutes ? "Update Minutes" : "Submit Minutes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View modal */}
      {selectedMinutes && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-md"
          onClick={() => {
            setSelectedMinutes(null)
          }}
        >
          <div
            className="w-full max-w-3xl rounded-[2.5rem] border border-slate-200 bg-white/95 p-10 shadow-2xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-8 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                  {getFileIcon(selectedMinutes.fileType)}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight uppercase">
                    {selectedMinutes.title}
                  </h2>
                  <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    {selectedMinutes.submittedBy.name} —{" "}
                    {formatDate(new Date(selectedMinutes.submittedAt))}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMinutes(null)
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {[
                  {
                    label: "Meeting",
                    value: selectedMinutes.meetingDate
                      ? formatDate(new Date(selectedMinutes.meetingDate))
                      : "—",
                    Icon: Calendar
                  },
                  {
                    label: "Type",
                    value: (selectedMinutes.fileType ?? "—").toUpperCase(),
                    Icon: FileText
                  },
                  { label: "Size", value: selectedMinutes.fileSize ?? "—", Icon: Paperclip },
                  { label: "Author", value: selectedMinutes.submittedBy.name, Icon: FileText }
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex items-center gap-2 opacity-40">
                      <Icon className="h-3 w-3" />
                      <span className="text-[9px] font-black tracking-widest uppercase">
                        {label}
                      </span>
                    </div>
                    <p className="text-xs font-black tracking-tight uppercase">{value}</p>
                  </div>
                ))}
              </div>

              {selectedMinutes.description && (
                <div className="rounded-4xl border border-slate-100 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="mb-3 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                    Notes / Summary
                  </p>
                  <pre className="max-h-64 overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                    {selectedMinutes.description}
                  </pre>
                </div>
              )}

              <div className="flex gap-4 pt-2">
                {selectedMinutes.fileUrl ? (
                  <>
                    <Button
                      onClick={() => window.open(selectedMinutes.fileUrl, "_blank")}
                      className="h-14 flex-2 gap-3 rounded-2xl bg-indigo-600 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-indigo-500/20 hover:bg-indigo-700"
                    >
                      <ExternalLink className="h-5 w-5" />
                      {selectedMinutes.fileType === "link" ? "Open Link" : "Open File"}
                    </Button>
                    {selectedMinutes.fileType !== "link" && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedMinutes.fileUrl, "_blank")}
                        className="h-14 flex-1 gap-3 rounded-2xl border-slate-200 text-[11px] font-black tracking-widest uppercase transition-all hover:bg-slate-900 hover:text-white"
                      >
                        <Download className="h-5 w-5" />
                        Download
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="py-4 text-sm font-medium text-slate-400 italic">
                    No file attached — notes shown above.
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
