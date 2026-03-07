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
    if (announcements.length > 0) {
      announcements.forEach( async (a) => markAsViewed(a._id))
      // Refresh sidebar unread count after views are recorded
      const t = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("announcements-unread-refresh"))
      }, 800)
      return () =>{  clearTimeout(t); }
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
    <div className="min-h-full space-y-4 bg-slate-50/50 p-4 font-sans dark:bg-slate-950/50">
      {/* Header - compact */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <Megaphone className="h-4 w-4" />
            </div>
            <Badge
              variant="outline"
              className="h-5 border-slate-200 bg-white px-1.5 text-[9px] font-black uppercase dark:bg-slate-900"
            >
              Workspace Updates
            </Badge>
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Project Broadcast
          </h2>
          <p className="text-sm font-medium text-slate-500 italic">
            Updates for <span className="text-blue-600">"{project?.title || "Project"}"</span>
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
            <Button className="h-9 gap-1.5 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg hover:bg-blue-700">
              <Plus className="h-4 w-4" />
              Broadcast Message
            </Button>
          </DialogTrigger>
          <DialogContent className="overflow-hidden rounded-2xl border-none p-0 shadow-xl sm:max-w-[480px]">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-4 text-white">
              <DialogTitle className="text-lg font-black">
                {editingId ? "Edit Announcement" : "New Announcement"}
              </DialogTitle>
              <DialogDescription className="text-sm text-blue-100/90">
                Keep your team aligned.
              </DialogDescription>
            </div>

            <div className="space-y-4 bg-white p-5 dark:bg-slate-950">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
                    placeholder="Headline..."
                    className="h-9 rounded-lg border-slate-200 bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div className="col-span-2 space-y-1 sm:col-span-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Category</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val: any) =>{  setFormData({ ...formData, type: val }); }}
                  >
                    <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50 dark:bg-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="ALERT">Alert</SelectItem>
                      <SelectItem value="MILESTONE">Milestone</SelectItem>
                      <SelectItem value="TEAM">Team</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1 sm:col-span-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">To</Label>
                  <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500 dark:bg-slate-900">
                    Entire project team
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) =>{  setFormData({ ...formData, content: e.target.value }); }}
                    placeholder="Details..."
                    className="min-h-[100px] resize-none rounded-lg border-slate-200 bg-slate-50 p-3 text-sm dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>{  setDialogOpen(false); }}
                  className="rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="rounded-lg bg-blue-600 px-5 hover:bg-blue-700"
                >
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {editingId ? "Save" : "Post"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter & Search - compact */}
      <div className="sticky top-2 z-10 flex flex-col gap-3 rounded-xl border border-slate-100 bg-white/90 p-3 shadow-sm backdrop-blur lg:flex-row dark:bg-slate-900">
        <div className="relative w-full flex-1 lg:max-w-xs">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search announcements..."
            className="h-9 rounded-lg border-slate-200 bg-slate-50 pl-9 text-sm dark:bg-slate-900"
            value={searchQuery}
            onChange={(e) =>{  setSearchQuery(e.target.value); }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "GENERAL", "ALERT", "MILESTONE", "TEAM", "SYSTEM"].map((t) => (
            <Button
              key={t}
              variant={activeType === t ? "default" : "ghost"}
              size="sm"
              onClick={() =>{  setActiveType(t as any); }}
              className={cn(
                "h-8 shrink-0 rounded-lg px-3 text-[9px] font-bold uppercase",
                activeType === t ? "bg-blue-600" : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {t}
            </Button>
          ))}
        </div>
      </div>

      {/* Main stream - compact cards */}
      <div className="mx-auto max-w-3xl space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
              <Bell className="h-7 w-7 text-slate-300" />
            </div>
            <h3 className="mb-1 text-lg font-black italic">No announcements</h3>
            <p className="mb-4 max-w-xs text-sm text-slate-400">
              No announcements match your filters.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg"
              onClick={() => {
                setSearchQuery("")
                setActiveType("ALL")
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <Card
              key={announcement._id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900",
                announcement.isPinned && "ring-1 ring-blue-500/40"
              )}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 gap-3">
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                        getTypeStyles(announcement.type)
                      )}
                    >
                      {getTypeIcon(announcement.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "h-4 px-1.5 text-[8px] font-bold uppercase",
                            getTypeStyles(announcement.type)
                          )}
                        >
                          {announcement.type}
                        </Badge>
                        {announcement.isPinned && (
                          <span className="flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[8px] font-bold text-blue-600 dark:bg-blue-900/30">
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDate(announcement.createdAt)}
                        </span>
                      </div>
                      <CardTitle className="text-base leading-snug font-black text-slate-900 dark:text-white">
                        {announcement.title}
                      </CardTitle>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
                      <DropdownMenuItem
                        className="rounded-lg py-2"
                        onClick={ async () => togglePin(announcement._id, announcement.isPinned)}
                      >
                        <Pin className="mr-2 h-3.5 w-3.5" />
                        {announcement.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg py-2"
                        onClick={() =>{  handleEdit(announcement); }}
                      >
                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="rounded-lg py-2 text-red-600 focus:text-red-600"
                        onClick={ async () => deleteAnnouncement(announcement._id)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="mb-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400">
                  {announcement.content}
                </div>
                {announcement.tags && announcement.tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {announcement.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-800"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7 border border-white shadow-sm">
                      <AvatarImage src={announcement.author.avatar} />
                      <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white">
                        {announcement.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {announcement.author.name}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">
                        {announcement.author.role}
                      </div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <Users className="h-3.5 w-3.5" />
                    Seen by {announcement.views?.length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
