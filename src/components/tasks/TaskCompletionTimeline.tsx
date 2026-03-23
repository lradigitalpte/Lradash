"use client"

import {
  CheckCircle2,
  XCircle,
  Clock,
  Paperclip,
  Send,
  ShieldCheck,
  ImageIcon,
  FileText,
  Video,
  Archive,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react"
import { useRef, useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { UserAvatar } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { uploadFileToS3 } from "@/lib/upload"
import { cn } from "@/lib/utils"

interface Attachment {
  name: string
  url: string
  type?: string
  size?: number
}

interface Submission {
  _id: string
  submittedBy: { userId: string; name: string; email: string; avatar?: string }
  submittedAt: string
  evidenceNote: string
  evidenceAttachments: Attachment[]
  status: "pending" | "approved" | "rejected"
  reviewedBy?: { userId: string; name: string; email?: string; avatar?: string }
  reviewedAt?: string
  reviewNote?: string
  reviewAttachments?: Attachment[]
}

interface Props {
  taskId: string
  projectId?: string
  isAdmin: boolean
  /** If true, hides the submit form (e.g. when embedded in the modal's sidebar) */
  compactMode?: boolean
  onTaskApproved?: () => void
}

function fileIcon(type?: string) {
  if (!type) {
    return <FileText className="h-4 w-4" />
  }
  if (type.startsWith("image/")) {
    return <ImageIcon className="h-4 w-4 text-blue-500" />
  }
  if (type.startsWith("video/")) {
    return <Video className="h-4 w-4 text-purple-500" />
  }
  if (type.includes("zip") || type.includes("archive")) {
    return <Archive className="h-4 w-4 text-amber-500" />
  }
  return <FileText className="h-4 w-4 text-slate-400" />
}

function formatBytes(bytes?: number) {
  if (!bytes) {
    return ""
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) {
    return "just now"
  }
  if (mins < 60) {
    return `${mins}m ago`
  }
  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return `${hours}h ago`
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}d ago`
  }
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TaskCompletionTimeline({
  taskId,
  projectId,
  isAdmin,
  compactMode = false,
  onTaskApproved
}: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState("")
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [reviewAttachments, setReviewAttachments] = useState<Attachment[]>([])
  const [reviewUploading, setReviewUploading] = useState(false)
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const reviewFileInputRef = useRef<HTMLInputElement>(null)

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await apiClient.get(`/api/tasks/${taskId}/completion`)
      if (res.ok) {
        const data = await res.json()
        setSubmissions(data.submissions || [])
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }
    setUploading(true)
    const newAttachments: Attachment[] = []
    try {
      for (const file of Array.from(files)) {
        const result = await uploadFileToS3(file, { projectId, taskId })
        newAttachments.push({
          name: file.name,
          url: result.publicUrl,
          type: file.type,
          size: file.size
        })
      }
      setAttachments((prev) => [...prev, ...newAttachments])
      toast.success(`${newAttachments.length} file(s) attached`)
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const handleReviewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      return
    }
    setReviewUploading(true)
    const newAttachments: Attachment[] = []
    try {
      for (const file of Array.from(files)) {
        const result = await uploadFileToS3(file, { projectId, taskId })
        newAttachments.push({
          name: file.name,
          url: result.publicUrl,
          type: file.type,
          size: file.size
        })
      }
      setReviewAttachments((prev) => [...prev, ...newAttachments])
      toast.success(`${newAttachments.length} file(s) attached to review`)
    } catch (err: any) {
      toast.error(err.message || "Upload failed")
    } finally {
      setReviewUploading(false)
      e.target.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!note.trim() && attachments.length === 0) {
      toast.error("Add a note or attach at least one file for the completion update")
      return
    }
    setSubmitting(true)
    try {
      const res = await apiClient.post(`/api/tasks/${taskId}/completion`, {
        evidenceNote: note.trim(),
        evidenceAttachments: attachments
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Submission failed")
      }
      toast.success("Completion update submitted!")
      setNote("")
      setAttachments([])
      await fetchSubmissions()
    } catch (err: any) {
      toast.error(err.message || "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReview = async (submissionId: string, action: "approve" | "reject" | "review") => {
    setReviewingId(submissionId)
    try {
      const res = await apiClient.patch(`/api/tasks/${taskId}/completion/${submissionId}`, {
        action,
        reviewNote: reviewNote.trim(),
        reviewAttachments
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Review failed")
      }
      if (action === "approve") {
        toast.success("Task approved and marked DONE!")
      } else if (action === "reject") {
        toast.success("Submission rejected")
      } else {
        toast.success("Review saved (still pending)")
      }
      setExpandedReviewId(null)
      setReviewNote("")
      setReviewAttachments([])
      await fetchSubmissions()
      if (action === "approve") {
        onTaskApproved?.()
      }
    } catch (err: any) {
      toast.error(err.message || "Review failed")
    } finally {
      setReviewingId(null)
    }
  }

  const statusBadge = (status: Submission["status"]) => {
    if (status === "approved") {
      return (
        <Badge className="gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-emerald-700 uppercase">
          <CheckCircle2 className="h-3 w-3" />
          Approved
        </Badge>
      )
    }
    if (status === "rejected") {
      return (
        <Badge className="gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-rose-700 uppercase">
          <XCircle className="h-3 w-3" />
          Rejected
        </Badge>
      )
    }
    return (
      <Badge className="gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-700 uppercase">
        <Clock className="h-3 w-3" />
        Pending Review
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Submit Completion Update Form */}
      {!compactMode && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-3 text-[11px] font-black tracking-widest text-slate-400 uppercase">
            Submit Completion Update
          </p>
          <Textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value)
            }}
            placeholder="Describe what was done, how it was completed, any notes for the reviewer…"
            className="mb-3 min-h-[90px] resize-none rounded-xl border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white"
          />

          {attachments.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachments.map((att, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  {fileIcon(att.type)}
                  <span className="max-w-[120px] truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {att.name}
                  </span>
                  {att.size && (
                    <span className="text-[10px] text-slate-400">{formatBytes(att.size)}</span>
                  )}
                  <button
                    onClick={() => {
                      setAttachments((prev) => prev.filter((_, j) => j !== i))
                    }}
                    className="ml-1 text-slate-300 hover:text-rose-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 rounded-xl text-[11px] font-black tracking-widest text-slate-500 uppercase hover:bg-slate-50 hover:text-slate-900"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
              {uploading ? "Uploading…" : "Attach Files"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,application/zip"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              disabled={submitting || uploading}
              onClick={handleSubmit}
              className="gap-2 rounded-xl bg-slate-900 px-4 text-[11px] font-black tracking-widest text-white uppercase hover:bg-blue-600 dark:bg-white dark:text-slate-900 dark:hover:bg-blue-100"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-black text-slate-400">No completion submissions yet</p>
            <p className="mt-1 text-[11px] text-slate-300">
              When someone submits a completion update, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub, idx) => (
              <div key={sub._id} className="relative flex gap-4">
                {/* Vertical line */}
                {idx < submissions.length - 1 && (
                  <div className="absolute top-12 bottom-0 left-5 w-px bg-slate-100 dark:bg-slate-800" />
                )}

                {/* Avatar column */}
                <div className="z-10 flex-shrink-0">
                  <UserAvatar
                    name={sub.submittedBy.name}
                    image={sub.submittedBy.avatar}
                    size="sm"
                  />
                </div>

                {/* Card */}
                <div
                  className={cn(
                    "flex-1 rounded-2xl border p-4 shadow-sm transition-all",
                    sub.status === "approved"
                      ? "border-emerald-100 bg-emerald-50/40 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                      : sub.status === "rejected"
                        ? "border-rose-100 bg-rose-50/40 dark:border-rose-900/30 dark:bg-rose-900/10"
                        : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
                  )}
                >
                  {/* Header row */}
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-slate-900 dark:text-white">
                        {sub.submittedBy.name}
                      </span>
                      <span className="text-[11px] text-slate-400">submitted completion</span>
                      <span className="text-[10px] font-bold text-slate-300">
                        · {timeAgo(sub.submittedAt)}
                      </span>
                    </div>
                    {statusBadge(sub.status)}
                  </div>

                  {/* Evidence note */}
                  {sub.evidenceNote && (
                    <p className="mb-3 text-sm leading-relaxed font-medium text-slate-700 dark:text-slate-300">
                      {sub.evidenceNote}
                    </p>
                  )}

                  {/* Attachments */}
                  {sub.evidenceAttachments && sub.evidenceAttachments.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {sub.evidenceAttachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {fileIcon(att.type)}
                          <span className="max-w-[140px] truncate">{att.name}</span>
                          {att.size && (
                            <span className="text-[9px] font-normal text-slate-300">
                              {formatBytes(att.size)}
                            </span>
                          )}
                          <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Review result (show when reviewer saved something) */}
                  {sub.reviewedBy && (
                    <div
                      className={cn(
                        "mt-2 flex items-start gap-2 rounded-xl px-3 py-2",
                        sub.status === "approved"
                          ? "bg-emerald-100/60 dark:bg-emerald-900/20"
                          : sub.status === "rejected"
                            ? "bg-rose-100/60 dark:bg-rose-900/20"
                            : "bg-amber-100/60 dark:bg-amber-900/20"
                      )}
                    >
                      <ShieldCheck
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 flex-shrink-0",
                          sub.status === "approved"
                            ? "text-emerald-600"
                            : sub.status === "rejected"
                              ? "text-rose-500"
                              : "text-amber-600"
                        )}
                      />
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "text-[11px] font-black",
                            sub.status === "approved"
                              ? "text-emerald-700"
                              : sub.status === "rejected"
                                ? "text-rose-600"
                                : "text-amber-700"
                          )}
                        >
                          {sub.reviewedBy.name}
                        </span>
                        <span className="ml-1 text-[11px] text-slate-500">
                          {sub.status === "approved"
                            ? "approved"
                            : sub.status === "rejected"
                              ? "rejected"
                              : "reviewed (pending)"}{" "}
                          {sub.reviewedAt ? `· ${timeAgo(sub.reviewedAt)}` : ""}
                        </span>
                        {sub.reviewNote && (
                          <p className="mt-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            "{sub.reviewNote}"
                          </p>
                        )}
                        {sub.reviewAttachments && sub.reviewAttachments.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {sub.reviewAttachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex items-center gap-1.5 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {fileIcon(att.type)}
                                <span className="max-w-[140px] truncate">{att.name}</span>
                                {att.size && (
                                  <span className="text-[9px] font-normal text-slate-300">
                                    {formatBytes(att.size)}
                                  </span>
                                )}
                                <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Admin review panel (only for pending + admin) */}
                  {isAdmin && sub.status === "pending" && (
                    <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {expandedReviewId === sub._id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={reviewNote}
                            onChange={(e) => {
                              setReviewNote(e.target.value)
                            }}
                            placeholder="Optional feedback / review note…"
                            className="min-h-[60px] resize-none rounded-xl border-slate-200 bg-slate-50 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
                          />
                          {reviewAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {reviewAttachments.map((att, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5 dark:border-slate-700 dark:bg-slate-800"
                                >
                                  {fileIcon(att.type)}
                                  <span className="max-w-[120px] truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                    {att.name}
                                  </span>
                                  {att.size && (
                                    <span className="text-[10px] text-slate-400">
                                      {formatBytes(att.size)}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => {
                                      setReviewAttachments((prev) => prev.filter((_, j) => j !== i))
                                    }}
                                    className="ml-1 text-slate-300 hover:text-rose-500"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                ref={reviewFileInputRef}
                                type="file"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,application/zip"
                                className="hidden"
                                onChange={handleReviewFileChange}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={reviewUploading || reviewingId === sub._id}
                                onClick={() => reviewFileInputRef.current?.click()}
                                className="gap-2 rounded-xl text-[10px] font-black tracking-widest text-slate-500 uppercase hover:bg-slate-50 hover:text-slate-900"
                              >
                                {reviewUploading ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Paperclip className="h-3.5 w-3.5" />
                                )}
                                {reviewUploading ? "Uploading…" : "Attach Review Files"}
                              </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Button
                                size="sm"
                                disabled={reviewingId === sub._id || reviewUploading}
                                onClick={async () => handleReview(sub._id, "approve")}
                                className="gap-1.5 rounded-xl bg-emerald-600 px-3 text-[10px] font-black tracking-widest text-white uppercase hover:bg-emerald-700"
                              >
                                {reviewingId === sub._id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                Mark as Done
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewingId === sub._id || reviewUploading}
                                onClick={async () => handleReview(sub._id, "reject")}
                                className="gap-1.5 rounded-xl border-rose-200 px-3 text-[10px] font-black tracking-widest text-rose-600 uppercase hover:bg-rose-50"
                              >
                                <XCircle className="h-3 w-3" />
                                Reject
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewingId === sub._id || reviewUploading}
                                onClick={async () => handleReview(sub._id, "review")}
                                className="gap-1.5 rounded-xl border-amber-200 px-3 text-[10px] font-black tracking-widest text-amber-700 uppercase hover:bg-amber-50"
                              >
                                <ShieldCheck className="h-3 w-3" />
                                Submit Review (Pending)
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setExpandedReviewId(null)
                                  setReviewNote("")
                                  setReviewAttachments([])
                                }}
                                className="rounded-xl px-3 text-[10px] font-black tracking-widest text-slate-400 uppercase"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExpandedReviewId(sub._id)
                            setReviewNote("")
                            setReviewAttachments([])
                          }}
                          className="gap-1.5 rounded-xl border-slate-200 px-3 text-[10px] font-black tracking-widest text-slate-600 uppercase hover:bg-slate-50"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                          Review this completion
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
