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

export default function BoardAnnouncementsPage() {
  const params = useParams()
  const boardId = params?.boardId as string
  const projects = useTaskStore((state) => state.projects)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeType, setActiveType] = useState<AnnouncementType | "ALL">("ALL")

  const [announcements, setAnnouncements] = useState<Announcement[]>([
    {
      id: "1",
      title: "Quarterly Roadmap Update 🚀",
      content:
        "We've finalized the Q1 roadmap! High priority focus on performance optimization and the new mobile view components. Check the Gantt chart for detailed timelines.",
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

  const project = projects.find((p) => (p as any)._id === boardId)

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
        name: "You",
        role: "Team Lead"
      },
      createdAt: new Date(),
      isPinned: false,
      type: formData.type
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setFormData({ title: "", content: "", type: "GENERAL" })
    setDialogOpen(false)
    toast.success("Announcement created!")
  }

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((ann) => {
      const matchesSearch =
        ann.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = activeType === "ALL" || ann.type === activeType
      return matchesSearch && matchesType
    })
  }, [announcements, searchQuery, activeType])

  const pinnedAnnouncements = filteredAnnouncements.filter((a) => a.isPinned)
  const unpinnedAnnouncements = filteredAnnouncements.filter((a) => !a.isPinned)

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-2">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
              <Megaphone className="h-5 w-5" />
            </div>
            <Badge variant="outline" className="h-6 bg-white px-2 text-[10px] font-black uppercase">
              Announcements
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tighter">Team Announcements</h1>
          <p className="max-w-2xl font-medium text-slate-500 italic">
            Stay updated with important announcements and milestones for{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title}"
            </span>
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="group h-12 gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-xl shadow-blue-500/25 hover:bg-blue-700">
              <Plus className="h-5 w-5 transition-transform group-hover:rotate-90" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Post Announcement</DialogTitle>
              <DialogDescription>
                Share important updates with your team. All members will be notified.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-bold">Title</Label>
                <Input
                  placeholder="e.g., Q1 Roadmap Update"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value })
                  }}
                  className="h-11 rounded-xl border-slate-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => {
                    setFormData({ ...formData, type: val as AnnouncementType })
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">General</SelectItem>
                    <SelectItem value="ALERT">Alert</SelectItem>
                    <SelectItem value="MILESTONE">Milestone</SelectItem>
                    <SelectItem value="TEAM">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold">Content</Label>
                <Textarea
                  placeholder="Write your announcement here..."
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value })
                  }}
                  className="min-h-[120px] resize-none rounded-xl border-slate-200"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                  }}
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="flex-1 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
                >
                  Post
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="sticky top-4 z-10 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/80 p-4 backdrop-blur-xl sm:flex-row sm:items-center dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
            className="h-11 rounded-xl border-none bg-slate-50 pl-11 dark:bg-slate-950"
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl">
                <Filter className="h-4 w-4" />
                Type
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl p-2">
              <DropdownMenuItem
                onClick={() => {
                  setActiveType("ALL")
                }}
                className="rounded-xl py-2"
              >
                All Types
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveType("GENERAL")
                }}
                className="rounded-xl py-2"
              >
                General
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveType("ALERT")
                }}
                className="rounded-xl py-2"
              >
                Alerts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveType("MILESTONE")
                }}
                className="rounded-xl py-2"
              >
                Milestones
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setActiveType("TEAM")
                }}
                className="rounded-xl py-2"
              >
                Team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-8">
        {pinnedAnnouncements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">
              📌 Pinned
            </h2>
            <div className="space-y-4">
              {pinnedAnnouncements.map((ann) => (
                <AnnouncementCard key={ann.id} announcement={ann} />
              ))}
            </div>
          </div>
        )}

        {unpinnedAnnouncements.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase">Recent</h2>
            <div className="space-y-4">
              {unpinnedAnnouncements.map((ann) => (
                <AnnouncementCard key={ann.id} announcement={ann} />
              ))}
            </div>
          </div>
        )}

        {filteredAnnouncements.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
              <Bell className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-black italic">No announcements yet</h3>
            <p className="mt-2 max-w-xs font-medium text-slate-400">
              Share important updates with your team. Create your first announcement!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  return (
    <Card className="group overflow-hidden rounded-3xl border-none bg-white shadow-xl shadow-slate-200/30 transition-all hover:shadow-2xl dark:bg-slate-900">
      <CardContent className="p-8">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 rounded-2xl border-2 border-blue-100 shadow-md dark:border-blue-900">
              <AvatarImage src={announcement.author.avatar} />
              <AvatarFallback className="bg-blue-600 text-white">
                {announcement.author.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="mb-1 text-xl font-black">{announcement.title}</h3>
              <p className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <span>{announcement.author.name}</span>
                <span>•</span>
                <span>{formatDate(announcement.createdAt)}</span>
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl">
              <DropdownMenuItem className="gap-2 py-2">
                <Pin className="h-4 w-4" />
                Pin
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 py-2">
                <Edit2 className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 py-2 text-red-600">
                <Trash2 className="h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mb-6 text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
          {announcement.content}
        </p>

        <div className="mb-6 flex flex-wrap gap-2">
          {announcement.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="rounded-full text-xs font-bold">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t pt-4">
          <Badge
            variant="outline"
            className={cn(
              "h-6 px-2 text-[9px] font-black uppercase",
              announcement.type === "ALERT" && "border-red-200 bg-red-50 text-red-600",
              announcement.type === "MILESTONE" && "border-amber-200 bg-amber-50 text-amber-600",
              announcement.type === "TEAM" && "border-blue-200 bg-blue-50 text-blue-600"
            )}
          >
            {announcement.type}
          </Badge>
          <Button variant="link" className="ml-auto gap-2 p-0 text-xs font-bold text-blue-600">
            React <Target className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
