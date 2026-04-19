"use client"

import { addDays, format, parseISO } from "date-fns"
import { CalendarDays, Check, Clock, Loader2, Repeat, Users, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api/client"
import { getMeetingRecurrenceLabel } from "@/lib/meetings/recurrence"

interface MeetingSchedulerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  projectId?: string
  mode?: "organization" | "project"
  defaultPreset?: "general" | "standup"
  /** When set, dialog loads this meeting and PATCHes instead of creating. */
  editMeetingId?: string | null
}

interface SuggestedPerson {
  userId: string
  name: string
  email: string
  googleCalendarConnected: boolean
}

const DEFAULT_TIMEZONE =
  typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"

function getTodayValue() {
  return new Date().toISOString().split("T")[0]
}

/** Last instant of a calendar day in UTC (for Google RRULE UNTIL). */
function endOfUtcCalendarDayAsIso(dateYmd: string): string {
  const parts = dateYmd.split("-").map((p) => parseInt(p, 10))
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error("Invalid end date")
  }
  const [y, m, d] = parts
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString()
}

interface MeetingApiPayload {
  id: string
  title: string
  description?: string
  startTime: string
  endTime: string
  timezone: string
  projectId?: string | null
  recurrence?: {
    enabled?: boolean
    frequency?: "DAILY" | "WEEKLY"
    interval?: number
    weekdays?: string[]
    until?: string | null
  } | null
  attendees: Array<{ email: string }>
}

export function MeetingSchedulerDialog({
  open,
  onOpenChange,
  onSuccess,
  projectId,
  mode = "project",
  defaultPreset = "general",
  editMeetingId = null
}: MeetingSchedulerDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const [loadingMeeting, setLoadingMeeting] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(getTodayValue())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("09:30")
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [attendeesText, setAttendeesText] = useState("")
  const [scheduleMode, setScheduleMode] = useState<"once" | "weekday-standup" | "daily">("once")
  const [recurrenceEndMode, setRecurrenceEndMode] = useState<"never" | "on">("never")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("")
  const [suggestions, setSuggestions] = useState<SuggestedPerson[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  /** Populated when loading a meeting for edit — used to split attendees vs suggestions. */
  const [editSnapshot, setEditSnapshot] = useState<MeetingApiPayload | null>(null)
  const attendeeHydrateKey = useRef<string>("")

  useEffect(() => {
    if (!open || editMeetingId) {
      return
    }

    if (defaultPreset === "standup") {
      setTitle("Morning Standup")
      setDescription("Daily team standup meeting")
      setScheduleMode("weekday-standup")
      setStartTime("09:00")
      setEndTime("09:30")
    } else {
      setTitle("")
      setDescription("")
      setScheduleMode("once")
      setStartTime("09:00")
      setEndTime("09:30")
    }

    setDate(getTodayValue())
    setTimezone(DEFAULT_TIMEZONE)
    setAttendeesText("")
    setSelectedEmails([])
    setRecurrenceEndMode("never")
    setRecurrenceEndDate("")
  }, [defaultPreset, open, editMeetingId])

  useEffect(() => {
    if (!open) {
      setEditSnapshot(null)
      attendeeHydrateKey.current = ""
    }
  }, [open])

  useEffect(() => {
    attendeeHydrateKey.current = ""
  }, [editMeetingId])

  useEffect(() => {
    if (!open || !editMeetingId) {
      return
    }

    let cancelled = false
    const load = async () => {
      setLoadingMeeting(true)
      setEditSnapshot(null)
      setSelectedEmails([])
      setAttendeesText("")
      try {
        const res = await apiClient.get(`/api/meetings/${editMeetingId}`)
        const data = (await res.json().catch(() => null)) as MeetingApiPayload | null
        if (!res.ok || cancelled || !data) {
          const errorMessage =
            data &&
            typeof data === "object" &&
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
              ? (data as { error: string }).error
              : "Failed to load meeting"
          throw new Error(errorMessage)
        }

        const start = new Date(data.startTime)
        const end = new Date(data.endTime)
        setTitle(data.title)
        setDescription(data.description || "")
        setDate(format(start, "yyyy-MM-dd"))
        setStartTime(format(start, "HH:mm"))
        setEndTime(format(end, "HH:mm"))
        setTimezone(data.timezone || DEFAULT_TIMEZONE)

        if (data.recurrence?.enabled) {
          const w = data.recurrence.weekdays || []
          const isWeekday =
            data.recurrence.frequency === "DAILY" &&
            w.length === 5 &&
            ["MO", "TU", "WE", "TH", "FR"].every((d) => w.includes(d))
          setScheduleMode(isWeekday ? "weekday-standup" : "daily")
          if (data.recurrence.until) {
            setRecurrenceEndMode("on")
            setRecurrenceEndDate(format(new Date(data.recurrence.until), "yyyy-MM-dd"))
          } else {
            setRecurrenceEndMode("never")
            setRecurrenceEndDate("")
          }
        } else {
          setScheduleMode("once")
          setRecurrenceEndMode("never")
          setRecurrenceEndDate("")
        }

        setEditSnapshot(data)
      } catch (e) {
        if (!cancelled) {
          toast.error(e instanceof Error ? e.message : "Failed to load meeting")
          onOpenChange(false)
        }
      } finally {
        if (!cancelled) {
          setLoadingMeeting(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, editMeetingId, onOpenChange])

  useEffect(() => {
    if (!editSnapshot?.attendees?.length || !open || !editMeetingId) {
      return
    }
    const key = `${editSnapshot.id}:${suggestions.length}`
    if (attendeeHydrateKey.current === key) {
      return
    }
    attendeeHydrateKey.current = key

    const emails = editSnapshot.attendees.map((a) => a.email).filter(Boolean)
    const selected: string[] = []
    const manual: string[] = []
    for (const e of emails) {
      const m = suggestions.find((s) => s.email.toLowerCase() === e.toLowerCase())
      if (m) {
        selected.push(m.email)
      } else {
        manual.push(e)
      }
    }
    setSelectedEmails(selected)
    setAttendeesText(manual.join(", "))
  }, [editSnapshot, editMeetingId, open, suggestions])

  useEffect(() => {
    if (recurrenceEndMode !== "on" || !recurrenceEndDate) {
      return
    }
    if (recurrenceEndDate < date) {
      setRecurrenceEndDate(date)
    }
  }, [date, recurrenceEndMode, recurrenceEndDate])

  useEffect(() => {
    if (!open) {
      return
    }
    let cancelled = false
    const load = async () => {
      setLoadingSuggestions(true)
      try {
        const q = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ""
        const res = await apiClient.get(`/api/meetings/suggested-attendees${q}`)
        if (!res.ok || cancelled) {
          return
        }
        const data = await res.json()
        if (!cancelled) {
          setSuggestions(Array.isArray(data.people) ? data.people : [])
        }
      } catch {
        if (!cancelled) {
          setSuggestions([])
        }
      } finally {
        if (!cancelled) {
          setLoadingSuggestions(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [open, projectId])

  const attendeePreview = useMemo(() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (const e of selectedEmails) {
      const t = e.trim()
      const k = t.toLowerCase()
      if (k && !seen.has(k)) {
        seen.add(k)
        out.push(t)
      }
    }
    for (const part of attendeesText.split(/[\n,]/)) {
      const t = part.trim()
      const k = t.toLowerCase()
      if (k && !seen.has(k)) {
        seen.add(k)
        out.push(t)
      }
    }
    return out
  }, [selectedEmails, attendeesText])

  const toggleEmail = (email: string) => {
    const normalized = email.trim().toLowerCase()
    setSelectedEmails((prev) =>
      prev.some((e) => e.toLowerCase() === normalized)
        ? prev.filter((e) => e.toLowerCase() !== normalized)
        : [...prev, email.trim()]
    )
  }

  const isEditMode = Boolean(editMeetingId)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    try {
      setSubmitting(true)

      const attendees = attendeePreview.map((email) => ({ email }))

      if (isEditMode && editMeetingId) {
        const response = await apiClient.patch(`/api/meetings/${editMeetingId}`, {
          title,
          description,
          start_time: new Date(`${date}T${startTime}`).toISOString(),
          end_time: new Date(`${date}T${endTime}`).toISOString(),
          timezone,
          attendees,
          ...(projectId ? { projectId } : {})
        })
        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.error || "Failed to update meeting")
        }

        toast.success("Meeting updated")
        onOpenChange(false)
        onSuccess()
        return
      }

      if (scheduleMode !== "once") {
        if (recurrenceEndMode === "on") {
          if (!recurrenceEndDate || recurrenceEndDate < date) {
            toast.error("Recurrence end date must be on or after the start date.")
            return
          }
        }
      }

      const recurrence =
        scheduleMode === "once"
          ? undefined
          : scheduleMode === "weekday-standup"
            ? {
                enabled: true,
                frequency: "DAILY",
                interval: 1,
                weekdays: ["MO", "TU", "WE", "TH", "FR"],
                ...(recurrenceEndMode === "on" && recurrenceEndDate
                  ? { until: endOfUtcCalendarDayAsIso(recurrenceEndDate) }
                  : {})
              }
            : {
                enabled: true,
                frequency: "DAILY",
                interval: 1,
                weekdays: [],
                ...(recurrenceEndMode === "on" && recurrenceEndDate
                  ? { until: endOfUtcCalendarDayAsIso(recurrenceEndDate) }
                  : {})
              }

      const response = await apiClient.post("/api/meetings", {
        title,
        description,
        start_time: new Date(`${date}T${startTime}`).toISOString(),
        end_time: new Date(`${date}T${endTime}`).toISOString(),
        timezone,
        attendees,
        ...(projectId ? { projectId } : {}),
        recurrence
      })
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Failed to schedule meeting")
      }

      toast.success("Meeting scheduled")
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(92vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="relative shrink-0 rounded-t-[2rem] bg-linear-to-r from-blue-600 to-indigo-700 px-6 py-5 pr-16 text-white sm:px-8 sm:py-6 sm:pr-18">
            <DialogClose
              className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </DialogClose>
            <DialogHeader>
              <DialogTitle className="text-xl font-black sm:text-2xl">
                {isEditMode
                  ? mode === "organization"
                    ? "Edit workspace meeting"
                    : "Edit project meeting"
                  : mode === "organization"
                    ? "Schedule Workspace Meeting"
                    : "Schedule Project Meeting"}
              </DialogTitle>
              <DialogDescription className="text-sm text-blue-100">
                {isEditMode
                  ? "Changes sync to Google Calendar (same connected account). Recurrence pattern and series end date must be changed in Google Calendar — this form updates time, details, and guests."
                  : "Create a Google Calendar event and generate a Meet link you can join from the app."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5 sm:px-8">
            {loadingMeeting ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-sm">Loading meeting…</p>
              </div>
            ) : (
              <div className="space-y-4">
                {!isEditMode ? (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      <Repeat className="mr-1 inline h-3.5 w-3.5" />
                      Schedule type
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={scheduleMode === "once" ? "default" : "outline"}
                        onClick={() => {
                          setScheduleMode("once")
                        }}
                      >
                        {scheduleMode === "once" && <Check className="mr-1.5 h-3.5 w-3.5" />}
                        One-time
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={scheduleMode === "weekday-standup" ? "default" : "outline"}
                        onClick={() => {
                          setScheduleMode("weekday-standup")
                          if (!title) {
                            setTitle("Morning Standup")
                          }
                          setStartTime("09:00")
                          setEndTime("09:30")
                        }}
                      >
                        {scheduleMode === "weekday-standup" && (
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        Weekday standup
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={scheduleMode === "daily" ? "default" : "outline"}
                        onClick={() => {
                          setScheduleMode("daily")
                        }}
                      >
                        {scheduleMode === "daily" && <Check className="mr-1.5 h-3.5 w-3.5" />}
                        Daily recurring
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">
                      <Repeat className="mr-1 inline h-3.5 w-3.5" />
                      Schedule
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {getMeetingRecurrenceLabel(editSnapshot?.recurrence ?? null)}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      To switch between one-time and recurring, or to change the series end date,
                      edit the event in Google Calendar.
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="meeting-title">Title</Label>
                  <Input
                    id="meeting-title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                    }}
                    placeholder="Weekly client sync"
                    required
                  />
                </div>

                {!isEditMode && scheduleMode !== "once" && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-300">
                    {scheduleMode === "weekday-standup"
                      ? "Creates a weekday recurring series (Mon–Fri) in Google Calendar, starting on the date below."
                      : "Creates a daily recurring series in Google Calendar, starting on the date below."}{" "}
                    Choose whether the series runs until you delete it in Calendar, or stops after
                    an end date (instances after that won&apos;t appear).
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="meeting-description">Description</Label>
                  <Textarea
                    id="meeting-description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                    }}
                    placeholder="Agenda, goals, or call notes"
                    rows={2}
                    className="min-h-0 resize-y"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-date">
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
                      {scheduleMode === "once" ? "Date" : "Starts on (first occurrence)"}
                    </Label>
                    <Input
                      id="meeting-date"
                      type="date"
                      value={date}
                      onChange={(e) => {
                        setDate(e.target.value)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-timezone">Timezone</Label>
                    <Input
                      id="meeting-timezone"
                      value={timezone}
                      onChange={(e) => {
                        setTimezone(e.target.value)
                      }}
                      placeholder="Europe/Berlin"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-start">
                      <Clock className="mr-1 inline h-3.5 w-3.5" />
                      Start
                    </Label>
                    <Input
                      id="meeting-start"
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value)
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="meeting-end">End</Label>
                    <Input
                      id="meeting-end"
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value)
                      }}
                      required
                    />
                  </div>
                </div>

                {!isEditMode && scheduleMode !== "once" && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Recurrence ends</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={recurrenceEndMode === "never" ? "default" : "outline"}
                        onClick={() => {
                          setRecurrenceEndMode("never")
                        }}
                      >
                        {recurrenceEndMode === "never" && <Check className="mr-1.5 h-3.5 w-3.5" />}
                        No end date
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={recurrenceEndMode === "on" ? "default" : "outline"}
                        onClick={() => {
                          setRecurrenceEndMode("on")
                          setRecurrenceEndDate((prev) => {
                            if (prev) {
                              return prev < date ? date : prev
                            }
                            return format(addDays(parseISO(date), 28), "yyyy-MM-dd")
                          })
                        }}
                      >
                        {recurrenceEndMode === "on" && <Check className="mr-1.5 h-3.5 w-3.5" />}
                        End on date
                      </Button>
                    </div>
                    {recurrenceEndMode === "on" && (
                      <div className="space-y-1.5 pt-1">
                        <Label
                          htmlFor="recurrence-until"
                          className="text-xs text-slate-600 dark:text-slate-400"
                        >
                          Last day the series can occur (inclusive)
                        </Label>
                        <Input
                          id="recurrence-until"
                          type="date"
                          value={recurrenceEndDate}
                          min={date}
                          onChange={(e) => {
                            setRecurrenceEndDate(e.target.value)
                          }}
                          required
                        />
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      <strong>No end date:</strong> the series continues until you remove or edit it
                      in Google Calendar. <strong>End on date:</strong> Google stops creating
                      occurrences after that day; your app will also stop listing future slots past
                      that point.
                    </p>
                  </div>
                )}

                <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                  <Label>
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    Attendees
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select people from your team who have connected Google Calendar in this
                    workspace (shown as &quot;Google&quot;) — they receive the invite on their
                    calendar. Add extra emails below if needed.
                  </p>

                  {loadingSuggestions ? (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading team…
                    </div>
                  ) : suggestions.length > 0 ? (
                    <ScrollArea className="max-h-[min(220px,32vh)] rounded-xl border border-slate-200 dark:border-slate-800">
                      <div className="space-y-0.5 p-2">
                        {suggestions.map((p) => {
                          const checked = selectedEmails.some(
                            (e) => e.toLowerCase() === p.email.toLowerCase()
                          )
                          return (
                            <label
                              key={p.userId}
                              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/80"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => {
                                  toggleEmail(p.email)
                                }}
                              />
                              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                {p.name}
                              </span>
                              {p.googleCalendarConnected ? (
                                <Badge
                                  variant="secondary"
                                  className="shrink-0 text-[10px] font-semibold"
                                >
                                  Google
                                </Badge>
                              ) : (
                                <span className="shrink-0 text-[10px] text-amber-700 dark:text-amber-400">
                                  Connect Google
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  ) : (
                    <p className="text-xs text-slate-500">
                      No team members found. Add emails manually below.
                    </p>
                  )}

                  <Textarea
                    id="meeting-attendees-extra"
                    value={attendeesText}
                    onChange={(e) => {
                      setAttendeesText(e.target.value)
                    }}
                    placeholder="More emails (comma or line separated)"
                    rows={3}
                    className="resize-none text-sm"
                  />
                  {attendeePreview.length > 0 && (
                    <ScrollArea className="max-h-20 rounded-lg border border-slate-200 bg-slate-50/70 p-2 dark:border-slate-800 dark:bg-slate-900/30">
                      <div className="flex flex-wrap gap-1.5">
                        {attendeePreview.map((email) => (
                          <Badge
                            key={email.toLowerCase()}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {email}
                          </Badge>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                  <p className="text-xs text-slate-500">
                    {attendeePreview.length} attendee{attendeePreview.length === 1 ? "" : "s"} in
                    this meeting.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4 sm:px-8 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting || loadingMeeting}>
                {submitting
                  ? isEditMode
                    ? "Saving…"
                    : "Scheduling…"
                  : isEditMode
                    ? "Save changes"
                    : "Schedule Meeting"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
