"use client"

import {
  UserMinus,
  Search,
  Users,
  CheckCircle2,
  Clock,
  Target,
  Shield,
  Clock3,
  ChevronDown,
  Filter,
  UserPlus2,
  Eye,
  Loader2
} from "lucide-react"
import { useParams } from "next/navigation"
import { useState, useMemo, useEffect, useCallback } from "react"
import { toast } from "sonner"

import { InviteMemberDialog } from "@/components/team/InviteMemberDialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

export default function ProjectTeamPage() {
  const params = useParams()
  const projectId = (params?.projectId || params?.boardId) as string
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [projectData, setProjectData] = useState<any>(null)
  const [memberToRemove, setMemberToRemove] = useState<{ id: string; name: string } | null>(null)
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  const loadProjectTeam = useCallback(async () => {
    if (!projectId) {
      return
    }
    try {
      const response = await apiClient.get(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProjectData(data)

        const members = [...(data.members || [])] as any[]
        const owner = data.owner

        if (owner && typeof owner === "object") {
          const ownerExists = members.find((m) => (m._id || m.id) === (owner._id || owner.id))
          if (!ownerExists) {
            members.unshift(owner)
          }
        }

        setProjectMembers(members)
      }
    } catch (error) {
      console.error("Failed to fetch project members:", error)
    }
  }, [projectId])

  useEffect(() => {
    if (!projectId) {
      return
    }
    setLoading(true)
    void loadProjectTeam().finally(() => {
      setLoading(false)
    })
  }, [projectId, loadProjectTeam])

  const projectTitle = projectData?.title || "Loading..."
  const canManageMembers = Boolean(projectData?.canManageMembers)
  const currentUserId = projectData?.currentUserId as string | undefined
  const tasks = projectData?.tasks || []
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("ALL")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  const projectOwnerId = projectData?.owner?._id?.toString() || projectData?.owner?.id?.toString()

  const actualMembers = projectMembers.map((m: Record<string, unknown>) => {
    const id = String(m._id || m.id || "")
    const orgRole = (m.organizationRole as string) || "MEMBER"

    let teamRole: "OWNER" | "ADMIN" | "MEMBER" | "CLIENT"
    let roleLabel: string
    let roleHint: string | undefined

    if (projectOwnerId && id === projectOwnerId) {
      teamRole = "OWNER"
      roleLabel = "Owner"
    } else if (orgRole === "CLIENT") {
      teamRole = "CLIENT"
      roleLabel = "Client"
      roleHint = "View only"
    } else if (orgRole === "ADMIN") {
      teamRole = "ADMIN"
      roleLabel = "Admin"
    } else if (orgRole === "OWNER") {
      teamRole = "ADMIN"
      roleLabel = "Org owner"
    } else {
      teamRole = "MEMBER"
      roleLabel = "Member"
    }

    return {
      id,
      name: m.name as string,
      email: (m.email as string) || "",
      role: roleLabel,
      teamRole,
      roleHint,
      organizationRole: orgRole,
      avatar:
        (m.avatar as string) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${String(m.name)}`,
      joined: m.createdAt
        ? new Date(m.createdAt as string).toISOString()
        : new Date().toISOString(),
      status: "Active" as const
    }
  })

  const allMembers = [...actualMembers]

  // Filter members
  const filteredMembers = useMemo(() => {
    return allMembers.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole =
        roleFilter === "ALL" ||
        member.teamRole === roleFilter ||
        (roleFilter === "VIEWER" && member.teamRole === "CLIENT")
      return matchesSearch && matchesRole
    })
  }, [allMembers, searchQuery, roleFilter])

  const roleFilterLabel =
    roleFilter === "ALL"
      ? "All"
      : roleFilter === "OWNER"
        ? "Owner"
        : roleFilter === "ADMIN"
          ? "Admin"
          : roleFilter === "MEMBER"
            ? "Member"
            : roleFilter === "CLIENT" || roleFilter === "VIEWER"
              ? "Clients"
              : roleFilter

  // Calculate stats for each member
  const getMemberStats = (memberName: string) => {
    const memberTasks = tasks.filter((t: any) => t.assignee?.name === memberName)
    const total = memberTasks.length
    const done = memberTasks.filter((t: any) => t.status === "DONE").length
    const inProgress = memberTasks.filter(
      (t: any) => t.status === "IN_PROGRESS" || t.status === "DOING"
    ).length
    const todo = memberTasks.filter((t: any) => t.status === "TODO").length
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

    return { total, done, inProgress, todo, completionRate }
  }

  const canShowRemoveForMember = (memberId: string, teamRole: string) => {
    if (teamRole === "OWNER") {
      return false
    }
    if (!currentUserId) {
      return false
    }
    if (canManageMembers) {
      return true
    }
    return memberId === currentUserId
  }

  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove) {
      return
    }
    setRemovingMemberId(memberToRemove.id)
    try {
      const response = await apiClient.delete(`/api/projects/${projectId}/members`, {
        userId: memberToRemove.id
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data?.error || "Failed to remove member")
      }
      toast.success(
        memberToRemove.id === currentUserId
          ? "You left the project"
          : `${memberToRemove.name} was removed from this project`
      )
      setMemberToRemove(null)
      await loadProjectTeam()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove member")
    } finally {
      setRemovingMemberId(null)
    }
  }

  return (
    <div className="min-h-full space-y-8 bg-slate-50/50 p-8 dark:bg-slate-950/50">
      {/* Header Section */}
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
              "{projectTitle}"
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Analytics Overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Members", value: allMembers.length, icon: Users, color: "blue" },
          {
            label: "Active Tasks",
            value: tasks.filter((t: any) => t.status !== "DONE").length,
            icon: Target,
            color: "orange"
          },
          {
            label: "Complete Projects",
            value: tasks.filter((t: any) => t.status === "DONE").length,
            icon: CheckCircle2,
            color: "green"
          },
          { label: "Work Efficiency", value: "84%", icon: Clock, color: "purple" }
        ].map((stat, idx) => (
          <Card
            key={idx}
            className="group overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl shadow-inner transition-colors",
                    stat.color === "blue"
                      ? "bg-blue-50 text-blue-600"
                      : stat.color === "orange"
                        ? "bg-orange-50 text-orange-600"
                        : stat.color === "green"
                          ? "bg-green-50 text-green-600"
                          : "bg-purple-50 text-purple-600"
                  )}
                >
                  <stat.icon className="h-4 w-4" />
                </div>
                <Badge
                  variant="secondary"
                  className="bg-slate-50 text-[9px] font-black tracking-tighter uppercase"
                >
                  +12%
                </Badge>
              </div>
              <div className="mb-0.5 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                {stat.label}
              </div>
              <div className="text-2xl font-black">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Control Bar */}
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
                Role: {roleFilterLabel}
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
                All roles
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("OWNER")
                }}
                className="rounded-xl px-3 py-2 font-bold text-blue-600"
              >
                Project owner
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("ADMIN")
                }}
                className="rounded-xl px-3 py-2 font-bold text-violet-600"
              >
                Admins
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("MEMBER")
                }}
                className="rounded-xl px-3 py-2 font-bold"
              >
                Team members
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRoleFilter("CLIENT")
                }}
                className="rounded-xl px-3 py-2 font-bold text-amber-700"
              >
                Clients (view only)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Team Members List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
              <UserPlus2 className="h-8 w-8 text-slate-300" />
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
                className="group relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Visual Accent */}
                <div
                  className={cn(
                    "absolute top-0 right-0 left-0 h-1",
                    member.teamRole === "OWNER"
                      ? "bg-blue-600"
                      : member.teamRole === "ADMIN"
                        ? "bg-violet-600"
                        : member.teamRole === "CLIENT"
                          ? "bg-amber-500"
                          : "bg-slate-300 dark:bg-slate-600"
                  )}
                />

                <CardContent className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="relative shrink-0">
                        <Avatar className="h-12 w-12 rounded-xl border-2 border-white shadow-md dark:border-slate-800">
                          <AvatarImage src={member.avatar} />
                          <AvatarFallback className="bg-blue-600 text-sm font-black text-white uppercase">
                            {member.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            "absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800",
                            member.status === "Active" ? "bg-green-500" : "bg-amber-500"
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="truncate text-base leading-tight font-bold text-slate-900 dark:text-white">
                          {member.name}
                        </h4>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <Badge
                            className={cn(
                              "h-5 max-w-full px-1.5 text-[8px] font-black tracking-tighter uppercase",
                              member.teamRole === "CLIENT"
                                ? "border border-amber-200/80 bg-amber-50 text-amber-900 hover:bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-100"
                                : member.teamRole === "OWNER"
                                  ? "bg-blue-600 text-white hover:bg-blue-600"
                                  : member.teamRole === "ADMIN"
                                    ? member.role === "Org owner"
                                      ? "bg-indigo-600 text-white hover:bg-indigo-600"
                                      : "bg-violet-600 text-white hover:bg-violet-600"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            {member.teamRole === "OWNER" && <Shield className="mr-0.5 h-2 w-2" />}
                            {member.teamRole === "ADMIN" && <Shield className="mr-0.5 h-2 w-2" />}
                            {member.teamRole === "CLIENT" && <Eye className="mr-0.5 h-2 w-2" />}
                            {member.role}
                          </Badge>
                          {member.roleHint && (
                            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                              {member.roleHint}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5 text-[9px] font-semibold tracking-wide text-slate-400 uppercase">
                            <Clock3 className="h-2 w-2" />
                            {new Date(member.joined).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canShowRemoveForMember(member.id, member.teamRole) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 shrink-0 gap-1 rounded-lg px-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                        onClick={() => {
                          setMemberToRemove({ id: member.id, name: member.name })
                        }}
                      >
                        <UserMinus className="h-3.5 w-3.5" />
                        {currentUserId === member.id ? "Leave" : "Remove"}
                      </Button>
                    )}
                  </div>

                  {/* Task stats — compact */}
                  <div className="rounded-xl bg-slate-50/80 p-3 dark:bg-slate-950/30">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        {
                          val: stats.total,
                          label: "Total",
                          color: "text-slate-900 dark:text-slate-100"
                        },
                        { val: stats.inProgress, label: "Active", color: "text-blue-600" },
                        { val: stats.done, label: "Done", color: "text-green-600" }
                      ].map((item, i) => (
                        <div key={i}>
                          <div className={cn("text-lg font-black tabular-nums", item.color)}>
                            {item.val}
                          </div>
                          <div className="text-[9px] font-bold tracking-wide text-slate-400 uppercase">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase">
                        <span className="text-slate-500">Velocity</span>
                        <span className="text-blue-600">{stats.completionRate}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000"
                          style={{ width: `${stats.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Invite Dialog */}
      <InviteMemberDialog
        projectId={projectId}
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        onInviteSent={() => {
          void loadProjectTeam()
        }}
      />

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {memberToRemove && currentUserId === memberToRemove.id
                ? "Leave this project?"
                : "Remove from project?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {memberToRemove && currentUserId === memberToRemove.id
                ? "You will lose access to this project until someone adds you again. Your organization account is unchanged."
                : memberToRemove
                  ? `${memberToRemove.name} will no longer be on this project. They remain in the organization unless you remove them there.`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!removingMemberId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={!!removingMemberId}
              onClick={(e) => {
                e.preventDefault()
                void handleConfirmRemoveMember()
              }}
            >
              {removingMemberId ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : memberToRemove && currentUserId === memberToRemove.id ? (
                "Leave project"
              ) : (
                "Remove from project"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
