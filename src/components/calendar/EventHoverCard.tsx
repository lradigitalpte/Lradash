"use client"

import { format, isAfter, isBefore } from "date-fns"
import { Calendar, Clock, ExternalLink, Trash2, Edit3, Video } from "lucide-react"
import Link from "next/link"
import { useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

function parseEventBounds(event: any): { start: Date | null; end: Date | null } {
  if (event.startAt && event.endAt) {
    return { start: new Date(event.startAt), end: new Date(event.endAt) }
  }
  const st = event.startTime
  const et = event.endTime
  if (typeof st === "string" && (st.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(st))) {
    const start = new Date(st)
    const end =
      typeof et === "string" && (et.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(et))
        ? new Date(et)
        : null
    return {
      start: Number.isNaN(start.getTime()) ? null : start,
      end: end && !Number.isNaN(end.getTime()) ? end : null
    }
  }
  return { start: null, end: null }
}

interface EventHoverCardProps {
  children: React.ReactNode
  event: any
  onDelete?: (id: string) => void
  onEdit?: (event: any) => void
}

export function EventHoverCard({ children, event, onDelete, onEdit }: EventHoverCardProps) {
  const isTask = !!event.isTask
  const isMeeting = !!event.isMeeting

  const { timeLine, isPast, isLive } = useMemo(() => {
    const { start, end } = parseEventBounds(event)
    const now = new Date()
    let timeLine = ""
    if (start && end) {
      timeLine = `${format(start, "EEEE, MMM d")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`
    } else if (event.startTime && event.endTime) {
      timeLine = `${event.startTime} – ${event.endTime}`
    } else if (event.dueDate) {
      timeLine = format(new Date(event.dueDate), "MMM d, yyyy")
    }
    const isPast = !!(end && isBefore(end, now))
    const isLive = !!(start && end && !isBefore(now, start) && !isAfter(now, end))
    return { bounds: { start, end }, timeLine, isPast, isLive }
  }, [event])

  const accent = isTask
    ? "bg-blue-600"
    : isMeeting
      ? "bg-[#1a73e8]"
      : event.type === "sync"
        ? "bg-emerald-500"
        : event.type === "blocked"
          ? "bg-amber-500"
          : "bg-indigo-500"

  return (
    <HoverCard openDelay={180} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        className={cn(
          "w-[min(100vw-2rem,22rem)] overflow-hidden rounded-2xl border p-0 shadow-2xl",
          "border-slate-200/80 bg-white text-slate-900",
          "dark:border-slate-700/90 dark:bg-[#303134] dark:text-slate-100"
        )}
        side="top"
        align="start"
        sideOffset={8}
      >
        <div className={cn("h-1 w-full", accent)} />

        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                isMeeting
                  ? "bg-[#1a73e8]/15 dark:bg-[#1a73e8]/25"
                  : "bg-slate-100 dark:bg-slate-600/40"
              )}
            >
              <Calendar
                className={cn(
                  "h-4 w-4",
                  isMeeting ? "text-[#1a73e8]" : "text-slate-500 dark:text-slate-300"
                )}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
                  {isTask ? "Task" : isMeeting ? "Calendar" : "Event"}
                </span>
                {isPast && (
                  <Badge
                    variant="secondary"
                    className="h-5 border-amber-200/60 bg-amber-100/90 px-1.5 text-[9px] font-bold text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/80 dark:text-amber-100"
                  >
                    Past
                  </Badge>
                )}
                {isLive && !isPast && (
                  <Badge className="h-5 bg-emerald-600 px-1.5 text-[9px] font-bold text-white hover:bg-emerald-600">
                    Now
                  </Badge>
                )}
                {event.type && !isTask && (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 uppercase dark:bg-slate-600/50 dark:text-slate-300">
                    {event.type}
                  </span>
                )}
              </div>
              <h4 className="text-base leading-snug font-bold tracking-tight text-slate-900 dark:text-white">
                {event.title}
              </h4>
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
            <span className="leading-snug">{timeLine || "—"}</span>
          </div>

          {event.description && (
            <p className="line-clamp-3 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-600/60 dark:text-slate-300">
              {event.description}
            </p>
          )}

          {!isTask && isMeeting && (
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-600/60">
              {onEdit && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-fit rounded-full border-slate-200 text-xs dark:border-slate-500"
                    onClick={() => {
                      onEdit(event)
                    }}
                  >
                    <Edit3 className="mr-2 h-3.5 w-3.5" />
                    Edit this occurrence
                  </Button>
                </div>
              )}
              {event.meetUri && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild={!isPast}
                    size="sm"
                    disabled={isPast}
                    className={cn(
                      "h-9 rounded-full px-4 text-xs font-semibold",
                      isPast && "pointer-events-none opacity-50"
                    )}
                  >
                    {isPast ? (
                      <span className="inline-flex items-center gap-2">
                        <Video className="h-3.5 w-3.5" />
                        Join unavailable
                      </span>
                    ) : (
                      <Link
                        href={event.meetUri}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2"
                      >
                        <Video className="h-3.5 w-3.5" />
                        Join with Google Meet
                      </Link>
                    )}
                  </Button>
                </div>
              )}
              {event.calendarHtmlLink && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 w-fit rounded-full border-slate-200 text-xs dark:border-slate-500"
                >
                  <Link href={event.calendarHtmlLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Open in Google Calendar
                  </Link>
                </Button>
              )}
              {isPast && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  This session has ended. Open Calendar to view details or schedule a new time.
                </p>
              )}
            </div>
          )}

          {!isTask && !isMeeting && (
            <div className="flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-600/60">
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
                className="h-8 rounded-lg border-slate-200 px-3 text-[9px] font-black tracking-widest uppercase dark:border-slate-600"
                onClick={() => onEdit?.(event)}
              >
                <Edit3 className="mr-2 h-3 w-3" />
                Edit
              </Button>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
