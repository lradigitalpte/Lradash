"use client"

import {
  Users,
  ShieldCheck,
  Building,
  Plus,
  Mail,
  Calendar,
  Layout,
  Search,
  ArrowRight,
  Target,
  Zap,
  Trash2,
  KeyRound
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { toast } from "sonner"

import { StatCard, UserAvatar, StatusBadge } from "@/components/common"
import { CreateMemberDialog } from "@/components/team/CreateMemberDialog"
import { InviteUserDialog } from "@/components/team/InviteUserDialog"
import { MemberDetailsSheet } from "@/components/team/MemberDetailsSheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  slug: string
}

interface Member {
  _id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  role: string
  joinedAt: string
}

export default function TeamPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<Member | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [updatingPasswordFor, setUpdatingPasswordFor] = useState<string | null>(null)

  useEffect(() => {
    loadTeamData()
  }, [])

  const loadTeamData = async () => {
    try {
      const response = await apiClient.get("/api/organizations/current")

      if (!response.ok) {
        toast.error("Failed to load team data")
        return
      }

      const data = await response.json()
      setOrganization({
        id: data.id,
        name: data.name,
        slug: data.slug
      })
      setMembers(data.members)
    } catch (error) {
      console.error("Failed to load team data:", error)
      toast.error("Failed to load team data")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    if (!organization) {
      return
    }
    if (!confirm("Are you sure you want to remove this member?")) {
      return
    }

    try {
      const response = await apiClient.delete(
        `/api/organizations/${organization.id}/members/${memberId}`
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to remove member")
        return
      }

      toast.success("Member removed successfully")
      loadTeamData()
    } catch (error) {
      toast.error("An error occurred while removing the member")
    }
  }

  const handleResetPassword = async () => {
    if (!organization) {
      return
    }
    if (!passwordTarget) {
      return
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setUpdatingPasswordFor(passwordTarget._id)
    try {
      const response = await apiClient.patch(
        `/api/organizations/${organization.id}/members/${passwordTarget._id}`,
        { password: newPassword }
      )

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to reset password")
        return
      }

      toast.success(`Password updated for ${passwordTarget.userName}`)
      setPasswordModalOpen(false)
      setPasswordTarget(null)
      setNewPassword("")
    } catch (error) {
      toast.error("An error occurred while updating password")
    } finally {
      setUpdatingPasswordFor(null)
    }
  }

  const stats = useMemo(() => {
    return {
      total: members.length,
      owners: members.filter((m) => m.role === "OWNER").length,
      admins: members.filter((m) => m.role === "ADMIN").length,
      activeToday: Math.ceil(members.length * 0.8) // Mock data
    }
  }, [members])

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl">
              <Users className="h-6 w-6 animate-pulse" />
            </div>
          </div>
          <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
            Loading Team
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen pb-32">
      {/* Dynamic Background Glows */}
      <div className="pointer-events-none absolute top-20 right-[15%] -z-10 h-125 w-125 rounded-full bg-blue-500/5 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-40 left-[20%] -z-10 h-112.5 w-112.5 rounded-full bg-indigo-500/5 blur-[120px]" />

      <div className="mx-auto max-w-400 space-y-12 p-8 lg:p-12">
        {/* WOW Header Section */}
        <div className="flex flex-col justify-between gap-8 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-6">
            <div className="group relative">
              <div className="absolute -inset-2 rounded-3xl bg-linear-to-r from-blue-600 to-indigo-700 opacity-20 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-500/30 transition-transform duration-500 group-hover:scale-105">
                <Users className="h-10 w-10 stroke-[2.5]" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-blue-600 uppercase shadow-sm dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  Team Directory
                </span>
                <div className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase italic">
                  Team Connection: Stable
                </span>
              </div>
              <h1 className="text-5xl leading-[0.9] font-black tracking-tighter text-slate-900 dark:text-white">
                Team{" "}
                <span className="bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Members
                </span>
              </h1>
              <p className="text-lg font-medium text-slate-500 italic opacity-80 dark:text-slate-400">
                Manage team members and project permissions
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 pb-2">
            {organization && (
              <>
                <CreateMemberDialog
                  organizationId={organization.id}
                  onMemberCreated={loadTeamData}
                />
                <InviteUserDialog organizationId={organization.id} onInviteSent={loadTeamData} />
              </>
            )}
          </div>
        </div>

        {/* Team Metrics Summary */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Members"
            value={stats.total}
            subtitle="Total team members"
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Owners"
            value={stats.owners}
            subtitle="Full platform access"
            icon={ShieldCheck}
            variant="default"
          />
          <StatCard
            title="Administrators"
            value={stats.admins}
            subtitle="Project management access"
            icon={Target}
            variant="warning"
          />
          <StatCard
            title="Active Today"
            value={stats.activeToday}
            subtitle="Members active today"
            icon={Zap}
            variant="success"
          />
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
          {/* Team Member List */}
          <div className="space-y-8">
            <Card className="overflow-hidden rounded-[2.5rem] border-none bg-white/60 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-900/60">
              <CardHeader className="p-10 pb-2">
                <div className="flex w-full flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                      <Layout className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black tracking-tight uppercase">
                        Team List
                      </CardTitle>
                      <CardDescription className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                        View and manage team members
                      </CardDescription>
                    </div>
                  </div>
                  <div className="group relative min-w-75">
                    <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-hover:text-blue-500" />
                    <input
                      type="text"
                      placeholder="Search team members..."
                      className="h-12 w-full rounded-2xl border-none bg-slate-50 pr-6 pl-12 text-xs font-bold transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800/50"
                    />
                  </div>
                </div>
              </CardHeader>
              <div className="p-10 pt-8">
                {members.length === 0 ? (
                  <div className="space-y-4 py-20 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 opacity-50 dark:bg-slate-800">
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="font-bold text-slate-400 italic">No team members found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <div
                        key={member._id}
                        className="group flex flex-col justify-between rounded-[2rem] border border-transparent bg-slate-50 p-6 shadow-sm transition-all duration-300 hover:border-slate-100 hover:bg-white hover:shadow-xl md:flex-row md:items-center dark:bg-slate-800/50 dark:hover:border-slate-700 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-center gap-5">
                          <UserAvatar
                            name={member.userName}
                            image={member.userAvatar}
                            size="lg"
                            className="shadow-lg ring-4 ring-white transition-transform duration-500 group-hover:scale-110 dark:ring-slate-900"
                          />
                          <div className="space-y-1">
                            <p className="text-lg font-black tracking-tight text-slate-900 uppercase transition-colors group-hover:text-blue-600 dark:text-white">
                              {member.userName}
                            </p>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2 py-0.5 dark:border-slate-700 dark:bg-slate-900">
                                <Mail className="h-3 w-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-500 lowercase">
                                  {member.userEmail}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-8 border-t border-slate-200 pt-6 md:mt-0 md:border-t-0 md:pt-0 dark:border-slate-700">
                          <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                              Platform Role
                            </p>
                            <StatusBadge
                              type="custom"
                              value={member.role}
                              size="sm"
                              className={cn(
                                "font-black tracking-widest uppercase",
                                member.role === "OWNER"
                                  ? "border-indigo-200 bg-indigo-100 text-indigo-700"
                                  : "border-blue-200 bg-blue-100 text-blue-700"
                              )}
                            />
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                              Joined Date
                            </p>
                            <div className="flex items-center justify-end gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar className="h-3.5 w-3.5" />
                              <span className="text-sm font-black italic">
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {member.role !== "OWNER" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  setPasswordTarget(member)
                                  setNewPassword("")
                                  setPasswordModalOpen(true)
                                }}
                                className="h-12 w-12 rounded-2xl text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/10"
                              >
                                <KeyRound className="h-5 w-5" />
                              </Button>
                            )}
                            {member.role !== "OWNER" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={async () => handleDeleteMember(member._id)}
                                className="h-12 w-12 rounded-2xl text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/10"
                              >
                                <Trash2 className="h-5 w-5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedMember(member)
                                setIsDetailsOpen(true)
                              }}
                              className="h-12 w-12 rounded-2xl opacity-0 transition-all group-hover:opacity-100 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-900"
                            >
                              <ArrowRight className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Institutional Integrity Sidebar */}
          <div className="space-y-10">
            <Card className="group relative overflow-hidden rounded-[2.5rem] border-none bg-slate-900 p-10 text-white shadow-2xl shadow-slate-200/50 dark:bg-white dark:text-slate-900">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
              <CardHeader className="mb-8 p-0">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 dark:bg-slate-900/5">
                    <Building className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-black tracking-tight uppercase">
                      Organization Profile
                    </CardTitle>
                    <CardDescription className="text-[10px] font-black tracking-[0.2em] text-white uppercase opacity-50 dark:text-slate-400">
                      Organization Details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 p-0">
                {organization && (
                  <>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                        Identifier
                      </p>
                      <p className="truncate text-2xl font-black tracking-tighter uppercase">
                        {organization.name}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">
                        Organization URL
                      </p>
                      <div className="flex items-center gap-3">
                        <code className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black tracking-widest dark:border-slate-200 dark:bg-slate-100">
                          {organization.slug}
                        </code>
                        <Zap className="h-4 w-4 text-blue-400" />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        className="h-14 w-full rounded-2xl border-white/20 bg-transparent text-[10px] font-black tracking-widest uppercase transition-all hover:bg-white hover:text-slate-900 dark:border-slate-200 dark:hover:bg-slate-900 dark:hover:text-white"
                      >
                        Edit Organization
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border border-none border-white/20 bg-white/60 p-10 shadow-xl shadow-slate-200/40 backdrop-blur-xl dark:border-slate-800/50 dark:bg-slate-900/60">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="text-lg font-black tracking-tight uppercase">Permissions</h4>
              </div>
              <p className="text-sm leading-relaxed font-medium text-slate-500 italic dark:text-slate-400">
                Permissions are managed by the organization owner. Only owners can modify roles or
                remove members from the team.
              </p>
            </Card>
          </div>
        </div>
      </div>
      <MemberDetailsSheet
        member={selectedMember}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
      <Dialog
        open={passwordModalOpen}
        onOpenChange={(open) => {
          setPasswordModalOpen(open)
          if (!open) {
            setPasswordTarget(null)
            setNewPassword("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new temporary password for {passwordTarget?.userName || "this member"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="team-reset-password" className="text-sm font-medium">
              New Password
            </label>
            <input
              id="team-reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
              }}
              placeholder="Minimum 8 characters"
              className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPasswordModalOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={updatingPasswordFor === passwordTarget?._id}
            >
              {updatingPasswordFor === passwordTarget?._id ? "Saving..." : "Save Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
