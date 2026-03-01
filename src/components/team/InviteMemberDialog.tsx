"use client"

import { Loader2, Search, UserPlus, Check } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api/client"
import { cn } from "@/lib/utils"

interface InviteMemberDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteSent?: () => void
}

export function InviteMemberDialog({
  projectId,
  open,
  onOpenChange,
  onInviteSent
}: InviteMemberDialogProps) {
  const [orgUsers, setOrgUsers] = useState<any[]>([])
  const [projectMemberIds, setProjectMemberIds] = useState<Set<string>>(new Set())
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!open) {
      return
    }
    setSearch("")
    setSelectedUserId(null)
    fetchData()
  }, [open])

  const fetchData = async () => {
    setLoadingUsers(true)
    try {
      const [orgRes, membersRes] = await Promise.all([
        apiClient.get("/api/organizations/current"),
        apiClient.get(`/api/projects/${projectId}/members`)
      ])

      if (orgRes.ok) {
        const orgData = await orgRes.json()
        // org members: [{ userId, userName, userEmail }]
        setOrgUsers(orgData.members || [])
      }

      if (membersRes.ok) {
        const membersData = await membersRes.json()
        // project members: [{ _id, name, email }]
        const ids = new Set<string>((membersData as any[]).map((m: any) => m._id))
        setProjectMemberIds(ids)
      }
    } catch (err) {
      console.error("Failed to load users:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Org users not yet in project
  const available = useMemo(() => {
    const q = search.toLowerCase()
    return orgUsers.filter((u) => {
      if (projectMemberIds.has(u.userId)) {
        return false
      }
      if (!q) {
        return true
      }
      return u.userName?.toLowerCase().includes(q) || u.userEmail?.toLowerCase().includes(q)
    })
  }, [orgUsers, projectMemberIds, search])

  const handleAdd = async () => {
    if (!selectedUserId) {
      return
    }
    setAdding(true)
    try {
      const response = await apiClient.post(`/api/projects/${projectId}/members`, {
        userId: selectedUserId
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add member")
      }
      const user = orgUsers.find((u) => u.userId === selectedUserId)
      toast.success(`${user?.userName || "User"} added to project`)
      onOpenChange(false)
      onInviteSent?.()
    } catch (err: any) {
      toast.error(err.message || "Failed to add member")
    } finally {
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <div className="relative h-28 bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white">
          <div className="absolute top-6 right-8 opacity-10">
            <UserPlus className="h-20 w-20" />
          </div>
          <DialogTitle className="mb-1 text-2xl font-black">Add Member</DialogTitle>
          <DialogDescription className="font-medium text-blue-100/80">
            Select an organisation member to add to this project.
          </DialogDescription>
        </div>

        <div className="space-y-4 bg-white p-6 dark:bg-slate-950">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
              }}
              className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm dark:bg-slate-900"
            />
          </div>

          {/* User list */}
          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100 dark:border-slate-800">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : available.length === 0 ? (
              <div className="py-10 text-center text-sm font-medium text-slate-400">
                {search
                  ? "No members match your search"
                  : "All organisation members are already in this project"}
              </div>
            ) : (
              available.map((u) => (
                <button
                  key={u.userId}
                  onClick={() => {
                    setSelectedUserId(u.userId === selectedUserId ? null : u.userId)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    selectedUserId === u.userId && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                    {(u.userName || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                      {u.userName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400">{u.userEmail}</p>
                  </div>
                  {selectedUserId === u.userId && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-slate-200 font-bold"
              onClick={() => {
                onOpenChange(false)
              }}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 rounded-xl bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700"
              onClick={handleAdd}
              disabled={!selectedUserId || adding}
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Project"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
