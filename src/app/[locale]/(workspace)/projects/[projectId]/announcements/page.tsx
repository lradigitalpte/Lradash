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
import { useState, useMemo } from "react"
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
import { useTaskStore } from "@/lib/store"
import { formatDate, cn } from "@/lib/utils"

type AnnouncementType = "GENERAL" | "ALERT" | "MILESTONE" | "TEAM" | "SYSTEM"

interface Announcement {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar?: string
    role: string
  }
  createdAt: Date
  isPinned: boolean
  type: AnnouncementType
  tags?: string[]
}

export default function ProjectAnnouncementsPage() {
  const params = useParams()
  const projectId = params?.projectId as string
  const projects = useTaskStore((state) => state.projects)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeType, setActiveType] = useState<AnnouncementType | "ALL">("ALL")

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Quarterly Roadmap Update 🚀",
      content:
        "We've finalized the Q1 roadmap! High priority focus on performance optimization and the new mobile view components. Check the Gantt chart for detailed timelines.\n\nKey focuses:\n- Backend API latency reduction\n- WebSocket stability improvements\n- UI/UX refinements in Dashboard",
      author: {
        name: "Alex Thompson",
        role: "Project Lead",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
      },
      createdAt: new Date(Date.now() - 3600000 * 24),
      isPinned: true,
      type: "MILESTONE",
      tags: ["Roadmap", "Q1", "Priority"]
    },
    {
      id: "2",
      title: "URGENT: Database Migration Window ⚠️",
      content:
        "Scheduled maintenance tonight at 11:00 PM EST. The platform will be in read-only mode for approximately 45 minutes as we migrate to the new cluster. Please ensure all active work is saved.",
      author: {
        name: "Systems Bot",
        role: "DevOps"
      },
      createdAt: new Date(Date.now() - 3600000 * 5),
      isPinned: false,
      type: "ALERT",
      tags: ["Infrastructure", "Maintenance"]
    },
    {
      id: "3",
      title: "Welcoming 2 New Members to the Creative Team!",
      content:
        "Please join me in welcoming Sarah and Michael to our design sprint! They'll be focusing on the brand refresh and component library documentation. Say hi in the general channel! 👋",
      author: {
        name: "Jessica Chen",
        role: "Creative Director",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica"
      },
      createdAt: new Date(Date.now() - 3600000 * 48),
      isPinned: false,
      type: "TEAM",
      tags: ["Hiring", "Company Culture"]
    }
  ])

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL" as AnnouncementType
  })

  const project = projects.find((p) => (p as any)._id === projectId)

  const handleCreate = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: formData.title,
      content: formData.content,
      author: {
        name: "Admin",
        role: "Project Manager"
      },
      createdAt: new Date(),
      isPinned: false,
      type: formData.type
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setFormData({ title: "", content: "", type: "GENERAL" })
    setDialogOpen(false)
    toast.success("Announcement posted successfully!")
  }

  const togglePin = (id: string) => {
    setAnnouncements(announcements.map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a)))
    toast.info("Pinned status updated")
  }

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((a) => a.id !== id))
    toast.success("Announcement deleted")
  }

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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
              <DialogTitle className="mb-1 text-2xl font-black">Create Announcement</DialogTitle>
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
                    onChange={(e) =>{  setFormData({ ...formData, title: e.target.value }); }}
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
                    onValueChange={(val: any) =>{  setFormData({ ...formData, type: val }); }}
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
                    onChange={(e) =>{  setFormData({ ...formData, content: e.target.value }); }}
                    placeholder="Details of the announcement..."
                    className="min-h-[150px] resize-none rounded-2xl border-slate-200 bg-slate-50 p-4 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={() =>{  setDialogOpen(false); }}
                  className="h-12 rounded-xl px-6 font-bold"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-8 font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                  Post Broadcast
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
            onChange={(e) =>{  setSearchQuery(e.target.value); }}
          />
        </div>

        <div className="scrollbar-hide flex w-full gap-2 overflow-x-auto pb-1 lg:w-auto lg:pb-0">
          {["ALL", "GENERAL", "ALERT", "MILESTONE", "TEAM", "SYSTEM"].map((t) => (
            <Button
              key={t}
              variant={activeType === t ? "default" : "ghost"}
              onClick={() =>{  setActiveType(t as any); }}
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
              key={announcement.id}
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
                        onClick={() =>{  togglePin(announcement.id); }}
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
                      <DropdownMenuItem className="gap-3 rounded-xl py-3">
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
                        onClick={() =>{  deleteAnnouncement(announcement.id); }}
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
                      <span className="text-xs">Seen by 24</span>
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
