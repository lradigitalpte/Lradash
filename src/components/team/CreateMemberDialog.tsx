"use client"

import { Loader2, UserPlus, Mail, Shield, Zap, Lock, User } from "lucide-react"
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

interface CreateMemberDialogProps {
  organizationId: string
  onMemberCreated?: () => void
}

export function CreateMemberDialog({ organizationId, onMemberCreated }: CreateMemberDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("MEMBER")
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!email.trim() || !name.trim() || !password.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.post(`/api/organizations/${organizationId}/members`, {
        email,
        name,
        password,
        role
      })

      if (!response.ok) {
        const data = await response.json()
        toast.error(data.error || "Failed to create member")
        return
      }

      toast.success(`Member ${name} created successfully`)
      setEmail("")
      setName("")
      setPassword("")
      setRole("MEMBER")
      setOpen(false)
      onMemberCreated?.()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create member"
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
          variant="outline"
          className="h-14 gap-3 rounded-2xl border-slate-200 px-8 text-sm font-black tracking-widest text-slate-900 uppercase shadow-xl transition-all hover:bg-slate-50 dark:border-slate-800 dark:text-white dark:hover:bg-slate-800"
        >
          <UserPlus className="h-5 w-5 stroke-[3]" />
          Create Member
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[2.5rem] border-none bg-white/80 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] backdrop-blur-2xl sm:max-w-[500px] dark:bg-slate-900/80 dark:shadow-none">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
              <User className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                Direct Creation
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                Manually create a new team member account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Full Name
            </Label>
            <div className="group relative">
              <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
              <Input
                placeholder="John Doe"
                className="h-14 rounded-2xl border-none bg-slate-50 pl-12 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800"
                value={name}
                onChange={(e) =>{  setName(e.target.value); }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Email Address
            </Label>
            <div className="group relative">
              <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
              <Input
                type="email"
                placeholder="email@example.com"
                className="h-14 rounded-2xl border-none bg-slate-50 pl-12 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800"
                value={email}
                onChange={(e) =>{  setEmail(e.target.value); }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Temporary Password
            </Label>
            <div className="group relative">
              <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
              <Input
                type="text"
                placeholder="e.g. TempPass123!"
                className="h-14 rounded-2xl border-none bg-slate-50 pl-12 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800"
                value={password}
                onChange={(e) =>{  setPassword(e.target.value); }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="ml-1 text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Organization Role
            </Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 px-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-indigo-600" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <SelectItem
                  value="MEMBER"
                  className="rounded-xl py-3 text-xs font-bold focus:bg-indigo-50 focus:text-indigo-600 dark:focus:bg-indigo-900/10"
                >
                  MEMBER
                </SelectItem>
                <SelectItem
                  value="ADMIN"
                  className="rounded-xl py-3 text-xs font-bold focus:bg-amber-50 focus:text-amber-600 dark:focus:bg-amber-900/10"
                >
                  ADMIN
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={loading}
            className="h-14 w-full rounded-2xl bg-indigo-600 text-xs font-black tracking-widest text-white uppercase shadow-xl shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:bg-indigo-700"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Team Member"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
