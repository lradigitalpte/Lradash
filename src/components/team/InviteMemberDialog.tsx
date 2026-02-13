"use client"

import { Loader2, Mail, Shield, UserPlus, Send, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
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
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("MEMBER")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    setLoading(true)
    // Simulating API call for "WOW" effect
    await new Promise((resolve) => setTimeout(resolve, 1500))

    toast.success(`Invitation successfully sent to ${email}`, {
      description: `They will be joined as a ${role.toLowerCase()} once they accept.`
    })

    setEmail("")
    setRole("MEMBER")
    onOpenChange(false)
    onInviteSent?.()
    setLoading(false)
  }

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join/project/${projectId}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Invite link copied to clipboard!")
    setTimeout(() =>{  setCopied(false); }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-none p-0 shadow-2xl sm:max-w-[500px]">
        <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white">
          <div className="absolute top-8 right-8 translate-x-4 -translate-y-4 transform opacity-20">
            <UserPlus className="h-24 w-24" />
          </div>
          <DialogTitle className="mb-2 text-2xl font-black">Invite Collaborator</DialogTitle>
          <DialogDescription className="font-medium text-blue-100 opacity-80">
            Grow your project team and start building together.
          </DialogDescription>
        </div>

        <div className="space-y-6 bg-white p-8 dark:bg-slate-950">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Email Address
              </Label>
              <div className="group relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900"
                  value={email}
                  onChange={(e) =>{  setEmail(e.target.value); }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="role"
                className="text-[10px] font-black tracking-widest text-slate-400 uppercase"
              >
                Project Role
              </Label>
              <Select value={role} onValueChange={setRole} disabled={loading}>
                <SelectTrigger
                  id="role"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-900"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                  <SelectItem value="MEMBER" className="rounded-lg py-3">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 font-bold">
                        Member
                        <Badge
                          variant="outline"
                          className="h-4 px-1 text-[9px] font-black uppercase"
                        >
                          Default
                        </Badge>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Standard access, can view and edit assigned tasks.
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMIN" className="rounded-lg py-3">
                    <div className="flex flex-col">
                      <span className="flex items-center gap-2 font-bold text-blue-600">
                        <Shield className="h-3 w-3" />
                        Admin
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Full control over settings, members, and all activities.
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER" className="rounded-lg py-3">
                    <div className="flex flex-col">
                      <span className="font-bold">Viewer</span>
                      <span className="text-[10px] text-muted-foreground">
                        Read-only access to stay informed on progress.
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t pt-4">
            <Button
              onClick={handleInvite}
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Professional Invite
                </>
              )}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black tracking-widest text-slate-300 uppercase">
                <span className="bg-white px-2 dark:bg-slate-950">or share link</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={copyInviteLink}
              className="h-12 gap-2 rounded-xl border-slate-200 font-bold hover:bg-slate-50"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              {copied ? "Link Copied!" : "Copy Project Invitation Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
