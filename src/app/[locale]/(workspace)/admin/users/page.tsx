"use client"

import { formatDistanceToNow } from "date-fns"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  UserCheck,
  UserX,
  Users
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { useAdminUsers } from "@/hooks/useAdmin"
import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  OWNER: {
    label: "Owner",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
  },
  ADMIN: {
    label: "Admin",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
  },
  MEMBER: {
    label: "Member",
    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
  }
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: {
    label: "Active",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"
  },
  INACTIVE: {
    label: "Inactive",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
  }
}

export default function AdminUsersPage() {
  const { users, loading, error, updateUser, resetUserPassword } = useAdminUsers()
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState("")

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleRoleChange = async (userId: string, orgRole: string) => {
    setUpdating(userId)
    try {
      await updateUser(userId, { orgRole })
      toast.success("Role updated successfully")
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update role")
    } finally {
      setUpdating(null)
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
    setUpdating(userId)
    try {
      await updateUser(userId, { status: newStatus })
      toast.success(`User ${newStatus === "ACTIVE" ? "activated" : "suspended"}`)
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update status")
    } finally {
      setUpdating(null)
    }
  }

  const handlePasswordReset = async () => {
    if (!passwordTarget) {
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setUpdating(passwordTarget.id)
    try {
      await resetUserPassword(passwordTarget.id, newPassword)
      toast.success(`Password updated for ${passwordTarget.name}`)
      setPasswordModalOpen(false)
      setPasswordTarget(null)
      setNewPassword("")
    } catch (e: any) {
      toast.error(e.message ?? "Failed to reset password")
    } finally {
      setUpdating(null)
    }
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500">Admin access required.</p>
          <Link href="/admin">
            <Button className="mt-4">Back to Admin</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-full pb-20">
      <div className="pointer-events-none absolute top-20 right-[10%] -z-10 h-[400px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />

      <div className="mx-auto max-w-[1400px] space-y-8 p-8 lg:p-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 pt-4 md:flex-row md:items-end">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-slate-500">
                <ArrowLeft className="h-4 w-4" />
                Admin
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                <Users className="h-7 w-7 stroke-[2]" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  Team Members
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  {users.length} member{users.length !== 1 ? "s" : ""} in your organization
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
            }}
            className="h-11 w-full rounded-2xl border border-slate-200/80 bg-white pr-4 pl-11 text-sm text-slate-900 placeholder-slate-400 shadow-sm ring-0 transition outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* User Table */}
        <Card className="border-slate-200/60 shadow-lg dark:border-slate-800/60">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm font-black tracking-widest uppercase">
              <Shield className="h-4 w-4 text-violet-600" />
              Users · {filtered.length} shown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No users found</p>
            ) : (
              <div className="space-y-2">
                {filtered.map((user) => {
                  const roleConf = ROLE_CONFIG[user.orgRole] ?? ROLE_CONFIG.MEMBER
                  const statusConf = STATUS_CONFIG[user.status] ?? STATUS_CONFIG.ACTIVE
                  const isUpdating = updating === user._id

                  return (
                    <div
                      key={user._id}
                      className={cn(
                        "flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all",
                        user.status === "SUSPENDED"
                          ? "border-red-100 bg-red-50/30 dark:border-red-900/20 dark:bg-red-900/5"
                          : "border-slate-100 bg-slate-50/60 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
                      )}
                    >
                      {/* Avatar */}
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-sm font-black text-white">
                          {user.name[0].toUpperCase()}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-400">{user.email}</p>
                      </div>

                      {/* Joined */}
                      <div className="hidden text-right md:block">
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          Joined
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <Badge className={cn("border-0 text-[10px] font-black", statusConf.color)}>
                        {statusConf.label}
                      </Badge>

                      {/* Role Control */}
                      {user.orgRole === "OWNER" ? (
                        <Badge className={cn("border-0 text-[10px] font-black", roleConf.color)}>
                          {roleConf.label}
                        </Badge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating}
                              className={cn(
                                "h-8 gap-1 rounded-xl text-[10px] font-black tracking-wider uppercase",
                                roleConf.color
                              )}
                            >
                              {isUpdating ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  {roleConf.label}
                                  <ChevronDown className="h-3 w-3" />
                                </>
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 rounded-2xl shadow-xl">
                            <DropdownMenuItem
                              onClick={async () => handleRoleChange(user._id, "ADMIN")}
                              className="gap-2 rounded-xl text-xs font-bold"
                            >
                              <Shield className="h-3.5 w-3.5 text-blue-500" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => handleRoleChange(user._id, "MEMBER")}
                              className="gap-2 rounded-xl text-xs font-bold"
                            >
                              <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                              Set as Member
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={async () => {
                                setPasswordTarget({ id: user._id, name: user.name })
                                setNewPassword("")
                                setPasswordModalOpen(true)
                              }}
                              className="gap-2 rounded-xl text-xs font-bold"
                            >
                              <KeyRound className="h-3.5 w-3.5 text-violet-600" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={async () => handleStatusToggle(user._id, user.status)}
                              className={cn(
                                "gap-2 rounded-xl text-xs font-bold",
                                user.status === "ACTIVE"
                                  ? "text-red-600 focus:text-red-600"
                                  : "text-emerald-600 focus:text-emerald-600"
                              )}
                            >
                              {user.status === "ACTIVE" ? (
                                <>
                                  <UserX className="h-3.5 w-3.5" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
              Set a new temporary password for {passwordTarget?.name || "this user"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label htmlFor="admin-reset-password" className="text-sm font-medium">
              New Password
            </label>
            <input
              id="admin-reset-password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
              }}
              placeholder="Minimum 8 characters"
              className="h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-violet-400/30"
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
            <Button onClick={handlePasswordReset} disabled={updating === passwordTarget?.id}>
              {updating === passwordTarget?.id ? "Saving..." : "Save Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
