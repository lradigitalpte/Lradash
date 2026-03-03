"use client"

import {
  Plus,
  Mail,
  MoreHorizontal,
  UserMinus,
  MessageSquare,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  Clock3,
  ExternalLink,
  ChevronDown,
  Filter,
  UserPlus2,
  ArrowUpRight,
  MoreVertical
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useMemo } from "react"

import { InviteMemberDialog } from "@/components/team/InviteMemberDialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useTaskStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export default function BoardTeamPage() {
  const params = useParams()
  const boardId = params?.boardId as string
  const projects = useTaskStore((state) => state.projects)

  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const project = projects.find((p) => (p as any)._id === boardId)
  const tasks = project?.tasks || []

  const mockMembers = [
    {
      id: "m-1",
      name: "Alex Thompson",
      email: "alex.t@example.com",
      role: "ADMIN",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
      joined: "2023-11-12",
      status: "Active"
    },
    {
      id: "m-2",
      name: "Sarah Chen",
      email: "s.chen@example.com",
      role: "MEMBER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      joined: "2023-12-05",
      status: "Away"
    },
    {
      id: "m-3",
      name: "Michael Rodriguez",
      email: "m.rod@example.com",
      role: "VIEWER",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
      joined: "2024-01-20",
      status: "Active"
    }
  ]

  const actualMembers =
    project?.members?.map((m) => ({
      id: (m as any).id || (m as any)._id,
      name: m.name,
      email: (m as any).email || `${m.name.toLowerCase().replace(" ", ".")}@example.com`,
      role: "MEMBER",
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`,
      joined: (m as any).createdAt
        ? new Date((m as any).createdAt).toISOString()
        : new Date().toISOString(),
      status: "Active"
    })) || []

  const allMembers = [...actualMembers, ...mockMembers]

  const filteredMembers = useMemo(() => {
    return allMembers.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === "ALL" || member.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [allMembers, searchQuery, roleFilter])

  const getMemberStats = (memberName: string) => {
    const memberTasks = tasks.filter((t) => t.assignee?.name === memberName)
    const total = memberTasks.length
    const done = memberTasks.filter((t) => t.status === "DONE").length
    const inProgress = memberTasks.filter(
      (t: any) => t.status === "IN_PROGRESS" || t.status === "DOING"
    ).length
    const todo = memberTasks.filter((t) => t.status === "TODO").length
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

    return { total, done, inProgress, todo, completionRate }
  }

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-1">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
              <Users className="h-4 w-4" />
            </div>
            <Badge
              variant="outline"
              className="h-5 bg-white px-1.5 text-[10px] font-black tracking-widest uppercase shadow-sm"
            >
              Core Workspace
            </Badge>
          </div>
          <h2 className="text-4xl font-black tracking-tighter">Team Members</h2>
          <p className="font-medium text-slate-500 italic">
            Managing and collaborating on{" "}
            <span className="text-blue-600 underline decoration-blue-500/30 underline-offset-4">
              "{project?.title}"
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="hidden items-center gap-2 rounded-2xl border-slate-200 bg-white lg:flex"
          >
            <ExternalLink className="h-4 w-4 text-slate-400" />
            Directory
          </Button>
          <Button
            onClick={() => {
              setIsInviteDialogOpen(true)
            }}
            className="group h-12 gap-2 rounded-2xl bg-blue-600 px-6 font-bold text-white shadow-xl shadow-blue-500/25 transition-all hover:bg-blue-700"
          >
            <UserPlus2 className="h-5 w-5 transition-transform group-hover:rotate-12" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Members", value: allMembers.length, icon: Users, color: "blue" },
          {
            label: "Active Tasks",
            value: tasks.filter((t) => t.status !== "DONE").length,
            icon: Target,
            color: "orange"
          },
          {
            label: "Complete Projects",
            value: tasks.filter((t) => t.status === "DONE").length,
            icon: CheckCircle2,
            color: "green"
          },
          { label: "Work Efficiency", value: "84%", icon: Clock, color: "purple" }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-3xl border-none bg-white shadow-xl shadow-slate-200/50 transition-all hover:scale-[1.02] dark:bg-slate-900 dark:shadow-none"
          >
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-slate-50 text-[10px] font-black tracking-tighter uppercase"
                >
                  +12%
                </Badge>
              </div>
              <div className="mb-1 text-sm font-black tracking-[0.2em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-3xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="sticky top-4 z-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-white bg-white/80 p-4 shadow-sm backdrop-blur-xl sm:flex-row dark:bg-slate-900">
        <div className="relative w-full max-w-md flex-1">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email or role..."
            className="h-12 rounded-2xl border-none bg-slate-50 pl-11 text-sm focus:ring-2 focus:ring-blue-500/20"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="mx-2 hidden h-8 w-[1px] bg-slate-100 sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 rounded-2xl text-xs font-black tracking-widest text-slate-500 uppercase"
              >
                <Filter className="h-4 w-4" />
                Role: {roleFilter}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 rounded-2xl border-slate-100 p-2 shadow-2xl">
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("ALL")
                }}
                className="rounded-xl px-3 py-2 font-bold"
              >
                All Roles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("ADMIN")
                }}
                className="rounded-xl px-3 py-2 font-bold text-blue-600"
              >
                Admin Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("MEMBER")
                }}
                className="rounded-xl px-3 py-2 font-bold"
              >
                Members Only
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("VIEWER")
                }}
                className="rounded-xl px-3 py-2 font-bold"
              >
                Viewers Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
              <UserPlus2 className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="mb-2 text-2xl font-black italic">Whoops! No members found</h3>
            <p className="mb-8 max-w-xs font-medium text-slate-400">
              Try adjusting your search query or filters to find what you're looking for.
            </p>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-2 border-slate-100 px-8 font-bold"
              onClick={() => {
                setSearchQuery("")
                setRoleFilter("ALL")
              }}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredMembers.map((member) => {
            const stats = getMemberStats(member.name)
            return (
              <Card
                key={member.id}
                className="group relative overflow-hidden rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/40 transition-all hover:translate-y-[-4px] dark:bg-slate-900 dark:shadow-none"
              >
                <div
                  className={cn(
                    "absolute top-0 right-0 left-0 h-2",
                    member.role === "ADMIN"
                      ? "bg-blue-600"
                      : member.role === "VIEWER"
                        ? "bg-slate-200"
                        : "bg-blue-400"
                  )}
                />

                <CardContent className="p-8">
                  <div className="mb-8 flex items-start justify-between">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <Avatar className="h-20 w-20 rounded-[2rem] border-4 border-white shadow-xl dark:border-slate-800">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-blue-600 text-2xl font-black text-white uppercase">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute right-0 bottom-0 h-6 w-6 rounded-full border-4 border-white shadow-lg dark:border-slate-800",
                            member.status === "Active" ? "bg-green-500" : "bg-amber-500"
                          )}
                        />
                      </div>
                      <div>
                        <h4 className="mb-1 text-xl leading-tight font-black text-slate-900 dark:text-white">
                          {member.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "h-4 px-1.5 text-[9px] font-black tracking-tighter uppercase",
                              member.role === "ADMIN"
                                ? "bg-blue-600"
                                : "bg-slate-100 text-slate-500"
                            )}
                          >
                            {member.role === "ADMIN" && <Shield className="mr-1 h-2 w-2" />}
                            {member.role}
                          </Badge>
                          <span className="flex items-center gap-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                            <Clock3 className="h-2.5 w-2.5" />
                            Joined{" "}
                            {new Date(member.joined).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>
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
                        <DropdownMenuItem className="gap-3 rounded-xl py-3">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Send Direct Message</span>
                            <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                              Slack/Discord style
                            </span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-3 rounded-xl py-3">
                          <Target className="h-4 w-4 text-orange-500" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Assign Work</span>
                            <span className="text-[10px] tracking-widest text-muted-foreground uppercase">
                              To-do list for them
                            </span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem className="gap-3 rounded-xl bg-red-50/50 py-3 text-red-600 hover:bg-red-50">
                          <UserMinus className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">Revoke Access</span>
                            <span className="text-[10px] tracking-widest text-red-500/60 uppercase">
                              Kick from project
                            </span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-6 rounded-3xl bg-slate-50/50 p-6 dark:bg-slate-950/20">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      {[
                        { val: stats.total, label: "Total", color: "text-slate-900" },
                        { val: stats.inProgress, label: "Progress", color: "text-blue-600" },
                        { val: stats.done, label: "Done", color: "text-green-600" }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className={cn("text-2xl font-black", item.color)}>{item.val}</div>
                          <div className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
                          Project Velocity
                        </span>
                        <span className="text-[10px] font-black text-blue-600">
                          {stats.completionRate}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 p-0.5 shadow-inner dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-center">
                    <Button variant="link" className="group gap-2 p-0 font-bold text-blue-600">
                      Detailed Performance Reports
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <InviteMemberDialog
        projectId={boardId}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
      />
    </div>
  )
}
