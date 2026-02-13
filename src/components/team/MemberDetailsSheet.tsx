"use client"

import { format } from "date-fns"
import {
  Users,
  Mail,
  Shield,
  Calendar,
  Activity,
  Clock,
  Target,
  Zap,
  MoreHorizontal,
  MailQuestion
} from "lucide-react"

import { UserAvatar, StatusBadge } from "@/components/common"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface Member {
  _id: string
  userId: string
  userName: string
  userEmail: string
  role: string
  joinedAt: string
}

interface MemberDetailsSheetProps {
  member: Member | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MemberDetailsSheet({ member, open, onOpenChange }: MemberDetailsSheetProps) {
  if (!member) {
    return null
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-hidden border-none bg-white/80 p-0 backdrop-blur-2xl sm:max-w-md dark:bg-slate-900/80">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mt-32 -mr-32 h-64 w-64 rounded-full bg-blue-500/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-32 -ml-32 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="relative flex h-full flex-col">
          {/* Cover Header */}
          <div className="relative h-40 bg-linear-to-br from-slate-900 via-blue-900 to-slate-900">
            <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay" />
            <div className="absolute -bottom-12 left-8">
              <UserAvatar
                name={member.userName}
                size="xl"
                className="h-24 w-24 shadow-2xl ring-8 ring-white dark:ring-slate-900"
              />
            </div>
          </div>

          <div className="flex-1 space-y-10 overflow-y-auto px-8 pt-16 pb-12">
            {/* Identity Group */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black tracking-tight text-slate-900 uppercase dark:text-white">
                  {member.userName}
                </h3>
                <StatusBadge type="status" value="ACTIVE" size="sm" />
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="h-3.5 w-3.5 stroke-[2.5]" />
                <span className="text-xs font-bold italic">{member.userEmail}</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 gap-2 rounded-2xl border-slate-200 text-[9px] font-black tracking-widest uppercase dark:border-slate-800"
              >
                <MailQuestion className="h-3.5 w-3.5" />
                Message
              </Button>
              <Button
                variant="outline"
                className="h-12 gap-2 rounded-2xl border-slate-200 text-[9px] font-black tracking-widest uppercase dark:border-slate-800"
              >
                <Zap className="h-3.5 w-3.5 text-blue-500" />
                Activity
              </Button>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-2 gap-6 rounded-[2.5rem] bg-slate-50/50 p-6 ring-1 ring-slate-100 dark:bg-slate-800/30 dark:ring-slate-800">
              <div className="space-y-1">
                <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Role Authority
                </p>
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <span className="text-sm tracking-tight">{member.role}</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] font-black tracking-[0.2em] text-slate-400 uppercase">
                  Deployment
                </p>
                <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm tracking-tight">
                    {format(new Date(member.joinedAt), "MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>

            {/* System Performance (Design Flair) */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-slate-900 uppercase dark:text-white">
                    Workspace Metrics
                  </h4>
                </div>
                <MoreHorizontal className="h-4 w-4 text-slate-300" />
              </div>

              <div className="space-y-4">
                <div className="group flex items-center justify-between rounded-3xl border border-slate-50 bg-white p-5 shadow-sm transition-all hover:border-blue-500/30 dark:border-slate-700/50 dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20">
                      <Target className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Task Completion
                      </p>
                      <p className="text-sm font-black text-slate-900 italic dark:text-white">
                        84.2% Success Rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-emerald-500">+12%</span>
                  </div>
                </div>

                <div className="group flex items-center justify-between rounded-3xl border border-slate-50 bg-white p-5 shadow-sm transition-all hover:border-blue-500/30 dark:border-slate-700/50 dark:bg-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                        Average Velocity
                      </p>
                      <p className="text-sm font-black text-slate-900 italic dark:text-white">
                        3.2 Missions / Week
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-400">Stable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Meta */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-8 py-6 dark:border-slate-800 dark:bg-slate-900/50">
            <span className="text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase">
              System Identifier: {member._id.slice(-8)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-xl text-[9px] font-black tracking-widest text-rose-500 uppercase hover:bg-rose-50 dark:hover:bg-rose-900/10"
            >
              Revoke Session
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
