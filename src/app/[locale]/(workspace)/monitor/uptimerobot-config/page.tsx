"use client"

import { ShieldCheck, Loader2 } from "lucide-react"

import { UptimeRobotConfigCard } from "@/components/monitor/UptimeRobotConfigCard"
import { useAdminAccess } from "@/hooks/useAdmin"

export default function UptimeRobotConfigPage() {
  const isAdmin = useAdminAccess()

  if (isAdmin === null) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase">Loading…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">
              UptimeRobot
            </p>
            <h1 className="text-3xl font-black tracking-tight">Configuration</h1>
            <p className="mt-1 text-[11px] font-bold text-slate-400">
              Set the token used by the new Websites-UR & Infrastructure-UR pages.
            </p>
          </div>
        </div>
      </div>

      <UptimeRobotConfigCard isAdmin={isAdmin} />
    </div>
  )
}
