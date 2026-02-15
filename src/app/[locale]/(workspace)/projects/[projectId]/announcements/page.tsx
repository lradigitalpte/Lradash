"use client"

import {
  Plus,
  Send,
  Pin,
  Trash2,
  Edit2,
  MoreVertical,
  Megaphone,
  AlertTriangle,
  Bell,
  Info,
  CheckCircle2,
  Search,
  Filter,
  ChevronDown,
  Clock,
  User,
  MoreHorizontal,
  X,
  Target,
  Users
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { useTaskStore } from "@/lib/store"
import { formatDate, cn } from "@/lib/utils"

type AnnouncementType = "GENERAL" | "ALERT" | "MILESTONE" | "TEAM" | "SYSTEM"

interface Announcement {
  _id: string
  title: string
  content: string
  author: {
    _id: string
    name: string
    avatar?: string
    role?: string
  }
  createdAt: Date
  isPinned: boolean
  type: AnnouncementType
  tags?: string[]
  views?: string[]
}

export default function ProjectAnnouncementsPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const projects = useTaskStore((state) => state.projects)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeType, setActiveType] = useState<AnnouncementType | "ALL">("ALL")

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = useCallback(async () => {
    if (!projectId) {
      return
    }
    try {
      setLoading(true)
      const response = await apiClient.get(`/api/projects/${projectId}/announcements`)
      if (response.ok) {
        const data = await response.json()
        // Map data to match interface if needed, or update interface
        setAnnouncements(
          data.map((a: any) => ({
            ...a,
            createdAt: new Date(a.createdAt),
            // Fallback for role as it might not be in user model in same way
            author: { ...a.author, role: "Member" }
          }))
        )
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL" as AnnouncementType
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const project = projects.find((p) => (p as any)._id === projectId)

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      let response
      if (editingId) {
        response = await apiClient.patch(`/api/projects/${projectId}/announcements/${editingId}`, {
          title: formData.title,
          content: formData.content,
          type: formData.type
        })
      } else {
        response = await apiClient.post(`/api/projects/${projectId}/announcements`, {
          title: formData.title,
          content: formData.content,
          type: formData.type,
          tags: [],
          isPinned: false
        })
      }

      if (!response.ok) {
        throw new Error(editingId ? "Failed to update announcement" : "Failed to post announcement")
      }

      toast.success(editingId ? "Announcement updated!" : "Announcement posted successfully!")
      setFormData({ title: "", content: "", type: "GENERAL" })
      setEditingId(null)
      setDialogOpen(false)
      fetchAnnouncements()
    } catch (error) {
      console.error("Save announcement error:", error)
      toast.error(editingId ? "Failed to update announcement" : "Failed to post announcement")
    }
  }

  const handleEdit = (announcement: Announcement) => {
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type
    })
    setEditingId(announcement._id)
    setDialogOpen(true)
  }

  const togglePin = async (id: string, currentStatus: boolean) => {
    try {
      const response = await apiClient.patch(`/api/projects/${projectId}/announcements/${id}`, {
        isPinned: !currentStatus
      })
      if (response.ok) {
        setAnnouncements(
          announcements.map((a) => (a._id === id ? { ...a, isPinned: !currentStatus } : a))
        )
        toast.success(currentStatus ? "Unpinned announcement" : "Pinned announcement to top")
      } else {
        throw new Error("Failed to update pin status")
      }
    } catch (error) {
      console.error("Pin error:", error)
      toast.error("Failed to update pin status")
    }
  }

  const deleteAnnouncement = async (id: string) => {
    try {
      const response = await apiClient.delete(`/api/projects/${projectId}/announcements/${id}`)
      if (response.ok) {
        setAnnouncements(announcements.filter((a) => a._id !== id))
        toast.success("Announcement deleted")
      } else {
        throw new Error("Failed to delete announcement")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete announcement")
    }
  }

  const markAsViewed = useCallback(
    async (id: string) => {
      try {
        // Optimistically update views locally if not already viewed?
        // Or just fire and forget.
        // Ideally we check if `views` includes current user, but we don't have current user ID easily available here without context.
        // API handles duplication check, so just fire it.
        await apiClient.patch(`/api/projects/${projectId}/announcements/${id}`, {
          action: "view"
        })
      } catch (error) {
        console.error("View tracking error", error)
      }
    },
    [projectId]
  )

  useEffect(() => {
    // Mark visible announcements as viewed?
    // For simplicity, let's just mark the top unread ones or rely on user interaction (like expanding/hovering).
    // Or maybe just fetch counts. The requirement "seen by x" implies we just need to show the count.
    // But if we want to increment it, we should do it when loaded.
    if (announcements.length > 0) {
      // Mark all loaded announcements as viewed by current user (backend handles dedup)
      announcements.forEach(async (a) => markAsViewed(a._id))
    }
  }, [announcements, markAsViewed])

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => {
        const matchesSearch =
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesType = activeType === "ALL" || a.type === activeType
        return matchesSearch && matchesType
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) {
          return -1
        }
        if (!a.isPinned && b.isPinned) {
          return 1
        }
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
  }, [announcements, searchQuery, activeType])

  const getTypeStyles = (type: AnnouncementType) => {
    switch (type) {
      case "ALERT":
        return "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
      case "MILESTONE":
        return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30"
      case "TEAM":
        return "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30"
      case "SYSTEM":
        return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30"
      default:
        return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800"
    }
  }

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case "ALERT":
        return <AlertTriangle className="h-4 w-4" />
      case "MILESTONE":
        return <Target className="h-4 w-4" />
      case "TEAM":
        return <Users className="h-4 w-4" />
      case "SYSTEM":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 font-sans dark:bg-slate-950/50">
      {/* Premium Header */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 transform items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 transition-transform hover:scale-110">
              <Megaphone className="h-5 w-5" />
            </div>
            <Badge
              variant="outline"
              className="h-6 border-slate-200 bg-white px-2 text-[10px] font-black tracking-[0.1em] uppercase shadow-sm dark:bg-slate-900"
            >
              Workspace Updates
            </Badge>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Project Broadcast
          </h2>
          <p className="font-medium text-slate-500 italic">
            Essential updates for{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title || "Project"}"
            </span>
          </p>
        </div>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setFormData({ title: "", content: "", type: "GENERAL" })
              setEditingId(null)
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="h-12 gap-2 rounded-2xl bg-blue-600 px-8 font-black text-white shadow-2xl shadow-blue-500/30 transition-all hover:-translate-y-1 hover:bg-blue-700">
              <Plus className="h-5 w-5" />
              Broadcast Message
            </Button>
          </DialogTrigger>
          <DialogContent className="overflow-hidden rounded-3xl border-none p-0 shadow-2xl sm:max-w-[550px]">
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
              <div className="absolute top-0 right-0 translate-x-12 -translate-y-8 scale-150 transform p-8 opacity-10">
                <Megaphone className="h-48 w-48" />
              </div>
              <DialogTitle className="mb-1 text-2xl font-black">
                {editingId ? "Edit Announcement" : "Create Announcement"}
              </DialogTitle>
              <DialogDescription className="font-medium text-blue-100 opacity-80">
                Keep your team aligned and informed.
              </DialogDescription>
            </div>

            <div className="space-y-6 bg-white p-8 dark:bg-slate-950">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Title
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ ...formData, title: e.target.value })
                    }}
                    placeholder="Catchy headline..."
                    className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900"
                  />
                </div>

                <div className="col-span-2 space-y-2 sm:col-span-1">
                  <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Category
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: any) => {
                      setFormData({ ...formData, type: val })
                    }}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="ALERT">Alert / Warning</SelectItem>
                      <SelectItem value="MILESTONE">Milestone</SelectItem>
                      <SelectItem value="TEAM">Team Update</SelectItem>
                      <SelectItem value="SYSTEM">System Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-2 sm:col-span-1">
                  <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Broadcast To
                  </Label>
                  <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-500 italic">
                    Entire Project Team
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    Content
                  </Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => {
                      setFormData({ ...formData, content: e.target.value })
                    }}
                    placeholder="Details of the announcement..."
                    className="min-h-[150px] resize-none rounded-2xl border-slate-200 bg-slate-50 p-4 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDialogOpen(false)
                  }}
                  className="h-12 rounded-xl px-6 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  {editingId ? "Save Changes" : "Post Broadcast"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter & Search Bar */}
      <div className="sticky top-4 z-10 flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-white bg-white/80 p-4 shadow-sm backdrop-blur-xl lg:flex-row dark:bg-slate-900">
        <div className="relative w-full flex-1 lg:max-w-md">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search announcements..."
            className="h-12 rounded-2xl border-none bg-slate-50 pl-11 text-sm focus:ring-2 focus:ring-blue-500/20"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
          />
        </div>

        <div className="scrollbar-hide flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto lg:pb-0">
          {["ALL", "GENERAL", "ALERT", "MILESTONE", "TEAM", "SYSTEM"].map((t) => (
            <Button
              key={t}
              variant={activeType === t ? "default" : "ghost"}
              onClick={() => {
                setActiveType(t as any)
              }}
              className={cn(
                "h-10 shrink-0 rounded-2xl px-6 text-[10px] font-black tracking-widest uppercase transition-all",
                activeType === t
                  ? "bg-blue-600 shadow-lg shadow-blue-500/20"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Stream */}
      <div className="mx-auto max-w-5xl space-y-8">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
              <Bell className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="mb-2 text-2xl font-black italic">Silent air...</h3>
            <p className="mb-8 max-w-xs font-medium text-slate-400">
              There are no announcements matching your filters at this time.
            </p>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-slate-200 px-8 font-bold"
              onClick={() => {
                setSearchQuery("")
                setActiveType("ALL")
              }}
            >
              Reset Controls
            </Button>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              className={cn(
                "group relative overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 transition-all duration-500 hover:scale-[1.01] dark:bg-slate-900 dark:shadow-none",
                announcement.isPinned && "ring-2 ring-blue-500/30"
              )}
            >
              <CardHeader className="p-8 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 shadow-inner",
                        getTypeStyles(announcement.type)
                      )}
                    >
                      {getTypeIcon(announcement.type)}
                    </div>
                    <div>
                      <div className="mb-1 flex items-center gap-3">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-5 px-1.5 text-[9px] font-black tracking-tighter uppercase",
                            getTypeStyles(announcement.type)
                          )}
                        >
                          {announcement.type}
                        </Badge>
                        {announcement.isPinned && (
                          <div className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black tracking-widest text-blue-600 uppercase">
                            <Pin className="h-2.5 w-2.5" />
                            Pinned
                          </div>
                        )}
                        <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                          <Clock className="h-3 w-3" />
                          {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                      <CardTitle className="text-2xl leading-tight font-black text-slate-900 dark:text-white">
                        {announcement.title}
                      </CardTitle>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 rounded-2xl transition-colors hover:bg-slate-50"
                      >
                        <MoreHorizontal className="h-5 w-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-56 rounded-2xl border-slate-100 p-2 shadow-2xl"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          togglePin(announcement._id, announcement.isPinned)
                        }}
                        className="gap-3 rounded-xl py-3"
                      >
                        <Pin className="h-4 w-4 text-blue-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">
                            {announcement.isPinned ? "Unpin Broadcast" : "Pin to Top"}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Stay visible for everyone
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="gap-3 rounded-xl py-3"
                        onClick={() => {
                          handleEdit(announcement)
                        }}
                      >
                        <Edit2 className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">Edit Content</span>
                          <span className="text-[10px] text-muted-foreground">
                            Fix typos or update details
                          </span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-2" />
                      <DropdownMenuItem
                        onClick={() => {
                          deleteAnnouncement(announcement._id)
                        }}
                        className="gap-3 rounded-xl bg-red-50/50 py-3 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold">Delete Forever</span>
                          <span className="text-[10px] font-medium text-red-500/60">
                            This cannot be undone
                          </span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="p-8 pt-0">
                <div className="prose dark:prose-invert mb-8 max-w-none text-lg leading-relaxed font-medium whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {announcement.content}
                </div>

                {announcement.tags && announcement.tags.length > 0 && (
                  <div className="mb-8 flex flex-wrap gap-2">
                    {announcement.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-800 dark:bg-slate-900"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-50 pt-8 dark:border-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-lg shadow-slate-200/50">
                      <AvatarImage src={announcement.author.avatar} />
                      <AvatarFallback className="bg-blue-600 text-xs font-black text-white uppercase">
                        {announcement.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-black text-slate-900 dark:text-white">
                        {announcement.author.name}
                      </div>
                      <div className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
                        {announcement.author.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      className="gap-2 rounded-full font-bold text-slate-400 transition-colors hover:text-blue-600"
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Seen by {announcement.views?.length || 0}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-10 w-10 rounded-full border border-slate-100 p-0 text-slate-400 hover:text-blue-600 dark:border-slate-800"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
