"use client"

import React from "react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface UptimeStatusBarsProps {
  count?: number
  gap?: number
  className?: string
  data?: ("UP" | "DOWN" | "WARNING" | "NONE")[]
}

export function UptimeStatusBars({ count = 40, gap = 2, className, data }: UptimeStatusBarsProps) {
  // Generate mock data if none provided
  const statusData =
    data ||
    Array.from({ length: count }, (_, i) => {
      const random = Math.random()
      if (random > 0.98) {
        return "DOWN"
      }
      if (random > 0.95) {
        return "WARNING"
      }
      return "UP"
    })

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn("flex items-center", className)} style={{ gap: `${gap}px` }}>
        {statusData.map((status, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "h-8 w-1.5 rounded-full transition-all duration-300 hover:scale-y-125",
                  status === "UP" &&
                    "bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.2)] hover:bg-emerald-400",
                  status === "DOWN" &&
                    "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)] hover:bg-red-400",
                  status === "WARNING" &&
                    "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.2)] hover:bg-amber-400",
                  status === "NONE" && "bg-slate-200 dark:bg-slate-800"
                )}
              />
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="rounded-xl border-none bg-slate-900 px-3 py-1.5 text-[10px] font-black tracking-widest text-white shadow-2xl"
            >
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mb-1",
                    status === "UP"
                      ? "text-emerald-400"
                      : status === "DOWN"
                        ? "text-red-400"
                        : status === "WARNING"
                          ? "text-amber-400"
                          : "text-slate-500"
                  )}
                >
                  {status === "UP"
                    ? "OPERATIONAL"
                    : status === "DOWN"
                      ? "OUTAGE"
                      : status === "WARNING"
                        ? "DEGRADED"
                        : "NO DATA"}
                </span>
                <span className="text-slate-400 opacity-50">
                  {new Date(Date.now() - (count - 1 - i) * 30 * 60000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
