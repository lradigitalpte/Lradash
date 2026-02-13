"use client"

import { format } from "date-fns"
import { Clock, MapPin, Users, Trash2, Edit3, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

interface EventHoverCardProps {
  children: React.ReactNode
  event: any
  onDelete?: (id: string) => void
}

export function EventHoverCard({ children, event, onDelete }: EventHoverCardProps) {
  const isTask = !!event.isTask

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className="w-80 overflow-hidden rounded-3xl border-slate-200 bg-white/95 p-0 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95"
        side="top"
        align="start"
      >
        <div
          className={cn(
            "h-2 w-full",
            isTask
              ? "bg-blue-600"
              : event.type === "sync"
                ? "bg-emerald-500"
                : event.type === "blocked"
                  ? "bg-amber-500"
                  : "bg-indigo-500"
          )}
        />

        <div className="space-y-4 p-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                {isTask ? "Task Details" : "Agenda Details"}
              </span>
              {event.type && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[8px] font-black tracking-widest text-slate-500 uppercase dark:bg-slate-800">
                  {event.type}
                </span>
              )}
            </div>
            <h4 className="text-lg leading-tight font-black tracking-tight text-slate-900 uppercase transition-colors group-hover:text-blue-600 dark:text-white">
              {event.title}
            </h4>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4 stroke-[2.5]" />
              <span className="text-xs font-bold italic tabular-nums">
                {event.startTime
                  ? `${event.startTime} - ${event.endTime}`
                  : format(new Date(event.dueDate || event.startTime), "HH:mm")}
              </span>
            </div>
            {event.description && (
              <p className="line-clamp-2 text-[11px] font-medium text-slate-500 italic dark:text-slate-400">
                "{event.description}"
              </p>
            )}
          </div>

          {!isTask && (
            <div className="flex items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/10"
                onClick={() => onDelete?.(event.id || event._id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-slate-200 px-3 text-[9px] font-black tracking-widest uppercase dark:border-slate-800"
              >
                <Edit3 className="mr-2 h-3 w-3" />
                Edit Schedule
              </Button>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
