"use client"

import { Loader2, UserPlus, Mail, Shield, Zap } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api/client"

interface InviteUserDialogProps {
  organizationId: string
  onInviteSent?: () => void
}

export function InviteUserDialog({ organizationId, onInviteSent }: InviteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("MEMBER")
  const [loading, setLoading] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post(`/api/organizations/${organizationId}/invite`, {
        email,
        role
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to send invitation")
        return
      }

      const data = await response.json()

      if (data.invitationUrl && typeof navigator !== "undefined") {
        await navigator.clipboard.writeText(data.invitationUrl).catch(() => undefined)
      }

      toast.success(`Invitation sent to ${email}`, {
        description: data.invitationUrl
          ? "The secure invite link has been copied to your clipboard."
          : "The invitation is ready for your delivery workflow."
      })
      setEmail("")
      setRole("MEMBER")
      setOpen(false)
      onInviteSent?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send invitation"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="group relative h-14 gap-3 overflow-hidden rounded-2xl bg-slate-900 px-8 text-sm font-black tracking-widest text-white uppercase shadow-2xl transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
          <UserPlus className="h-5 w-5 stroke-[3]" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-none bg-white/80 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:max-w-[500px] dark:bg-slate-900/80 dark:shadow-none">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                Add Member
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Send a secure invite to a teammate or client
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-8 py-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-blue-500" />
              <Label
                htmlFor="email"
                className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase"
              >
                Email Address
              </Label>
            </div>
            <Input
              id="email"
              type="email"
              placeholder="member@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              disabled={loading}
              className="h-14 rounded-2xl border-none bg-slate-50 px-6 text-sm font-bold transition-all placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800/50"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              <Label
                htmlFor="role"
                className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase"
              >
                Member Role
              </Label>
            </div>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger
                id="role"
                className="h-14 rounded-2xl border-none bg-slate-50 px-6 text-sm font-bold transition-all focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-800/50"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-slate-100 p-2 shadow-2xl">
                <SelectItem
                  value="MEMBER"
                  className="rounded-xl py-3 font-bold focus:bg-blue-50 focus:text-blue-600"
                >
                  Member
                </SelectItem>
                <SelectItem
                  value="CLIENT"
                  className="rounded-xl py-3 font-bold focus:bg-emerald-50 focus:text-emerald-600"
                >
                  Client
                </SelectItem>
                <SelectItem
                  value="ADMIN"
                  className="rounded-xl py-3 font-bold focus:bg-indigo-50 focus:text-indigo-600"
                >
                  Admin
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
          <Button
            variant="ghost"
            onClick={() => {
              setOpen(false)
            }}
            disabled={loading}
            className="h-14 flex-1 rounded-2xl text-[10px] font-black tracking-widest text-slate-400 uppercase transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={loading}
            className="group relative h-14 flex-[2] overflow-hidden rounded-2xl bg-slate-900 text-[10px] font-black tracking-widest text-white uppercase shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] dark:bg-white dark:text-slate-900"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 transition-opacity group-hover:opacity-100" />
                Send Invitation
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
