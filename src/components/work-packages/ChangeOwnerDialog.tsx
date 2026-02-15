"use client"

import { User, UserCheck, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"

interface OrgMember {
  _id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  joinedAt: string
}

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
}

interface ChangeOwnerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workPackageId: string
  currentOwner: User
  projectId: string
  onOwnerChanged: () => void
}

export function ChangeOwnerDialog({
  open,
  onOpenChange,
  workPackageId,
  currentOwner,
  projectId,
  onOwnerChanged
}: ChangeOwnerDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<OrgMember[]>([])

  // Fetch organization members when dialog opens
  const fetchOrgMembers = async () => {
    try {
      const response = await apiClient.get("/api/organizations/current")

      if (response.ok) {
        const orgData = await response.json()
        setMembers(orgData.members || [])
      }
    } catch (error) {
      console.error("Failed to fetch organization members:", error)
      toast.error("Failed to load organization members")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen)
    if (isOpen && members.length === 0) {
      fetchOrgMembers()
    }
  }

  const handleOwnerChange = async () => {
    if (!selectedUserId) {
      toast.error("Please select a new owner")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.patch(`/api/workpackages/${workPackageId}/owner`, {
        ownerId: selectedUserId
      })

      if (response.ok) {
        toast.success("Owner changed successfully!")
        onOwnerChanged()
        onOpenChange(false)
        setSelectedUserId("")
      } else {
        toast.error("Failed to change owner")
      }
    } catch (error) {
      console.error("Error changing owner:", error)
      toast.error("Failed to change owner")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2.5rem] border-white/20 bg-white/95 p-0 shadow-2xl backdrop-blur-xl sm:max-w-[600px] dark:border-slate-800/50 dark:bg-slate-900/95">
        <div className="relative">
          {/* Premium Header Background */}
          <div className="absolute top-0 right-0 left-0 -z-10 h-32 bg-gradient-to-br from-purple-600/5 to-pink-600/5" />
          <div className="absolute top-10 right-10 -z-10 h-32 w-32 rounded-full bg-purple-500/10 blur-3xl" />

          <DialogHeader className="p-10 pb-4">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl dark:bg-white dark:text-slate-900">
                <User className="h-6 w-6 stroke-[2.5]" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-black tracking-tight uppercase">
                  Change Owner
                </DialogTitle>
                <DialogDescription className="mt-1 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Transfer ownership of this work package to another organization member
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Current Owner Display */}
          <div className="mb-8 px-10">
            <div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <Avatar className="h-12 w-12 rounded-xl border-4 border-white shadow-lg dark:border-slate-900">
                <AvatarImage src={currentOwner.avatar} />
                <AvatarFallback className="bg-blue-600 text-xs font-black text-white">
                  {currentOwner.name?.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                  Current Owner
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {currentOwner.name}
                </span>
                <span className="text-xs font-medium text-slate-500">{currentOwner.email}</span>
              </div>
            </div>
          </div>

          {/* New Owner Selection */}
          <div className="space-y-4 px-10 pb-8">
            <label className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              Select New Owner
            </label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-bold focus:ring-purple-500/20 dark:border-slate-800 dark:bg-slate-950/50">
                <SelectValue placeholder="Choose a new owner..." />
              </SelectTrigger>
              <SelectContent className="max-h-80 rounded-2xl border-slate-100 p-2 shadow-2xl">
                {members
                  .filter((member) => member.userId !== currentOwner._id)
                  .map((member) => (
                    <SelectItem
                      key={member.userId}
                      value={member.userId}
                      className="rounded-xl px-4 py-3 font-bold"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 rounded-lg border-2 border-white shadow-sm dark:border-slate-800">
                          <AvatarFallback className="bg-purple-600 text-[10px] font-black text-white">
                            {member.userName?.slice(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {member.userName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-slate-500">
                              {member.userEmail}
                            </span>
                            {member.role && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-black tracking-wider text-slate-600 uppercase">
                                {member.role}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex items-center !justify-between px-10 pt-4 pb-10 sm:!justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onOpenChange(false)
              }}
              disabled={loading}
              className="h-14 rounded-2xl px-8 text-[11px] font-black tracking-widest text-slate-400 uppercase transition-colors hover:text-rose-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOwnerChange}
              disabled={loading || !selectedUserId}
              className="h-14 gap-3 rounded-2xl bg-slate-900 px-10 text-[11px] font-black tracking-widest text-white uppercase shadow-xl shadow-slate-200/50 transition-all hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-900 dark:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Transfer Ownership
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
