"use client"

import { format } from "date-fns"
import {
  CalendarClock,
  ExternalLink,
  Link2,
  Loader2,
  Pencil,
  Repeat,
  Trash2,
  Video,
  Waves
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { MeetingSchedulerDialog } from "@/components/meetings/MeetingSchedulerDialog"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/useAuth"
import { useGoogleWorkspaceConnection } from "@/hooks/useGoogleWorkspaceConnection"
import { useMeetings } from "@/hooks/useMeetings"
import { getMeetingRecurrenceLabel } from "@/lib/meetings/recurrence"

interface OrganizationMeetingsPanelProps {
  /** Called after meetings list changes so other views (e.g. org calendar grid) can refresh. */
  onMeetingsChanged?: () => void
}

export function OrganizationMeetingsPanel({ onMeetingsChanged }: OrganizationMeetingsPanelProps) {
  const { user } = useAuth()
  const { loading: connectionLoading, busy, status, connect } = useGoogleWorkspaceConnection()
  const { loading, nextOccurrences, refresh, cancelMeeting } = useMeetings()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogPreset, setDialogPreset] = useState<"general" | "standup">("general")
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null)
  const [pendingCancel, setPendingCancel] = useState<{
    id: string
    title: string
    recurring: boolean
  } | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const upcomingOccurrences = useMemo(() => {
    const now = new Date()
    return [...nextOccurrences]
      .filter((o) => o.occurrenceEnd > now)
      .sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime())
  }, [nextOccurrences])

  const confirmCancelMeeting = async () => {
    if (!pendingCancel) {
      return
    }
    setCancelling(true)
    try {
      await cancelMeeting(pendingCancel.id)
      toast.success(
        pendingCancel.recurring
          ? "Series removed from Google Calendar and workspace"
          : "Meeting removed from Google Calendar and workspace"
      )
      setPendingCancel(null)
      onMeetingsChanged?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not cancel meeting")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
      <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="bg-linear-to-r from-slate-900 via-blue-950 to-indigo-950 px-4 py-4 text-white sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <CalendarClock className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-lg font-black tracking-tight sm:text-xl">
                    General Meetings
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs text-blue-100/90">
                    Workspace standups & syncs. Past sessions drop off automatically.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge className="max-w-full truncate bg-white/10 text-[10px] text-white hover:bg-white/10">
                  {connectionLoading
                    ? "Checking Google"
                    : status.connected
                      ? `Connected: ${status.accountEmail || "Google"}`
                      : "Google not connected"}
                </Badge>
                <Badge className="bg-white/10 text-[10px] text-white hover:bg-white/10">
                  {upcomingOccurrences.length} upcoming
                </Badge>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              {status.connected ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditMeetingId(null)
                      setDialogPreset("standup")
                      setDialogOpen(true)
                    }}
                    disabled={busy}
                    className="rounded-xl bg-white text-xs font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    <Repeat className="mr-1.5 h-3.5 w-3.5" />
                    Standup
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditMeetingId(null)
                      setDialogPreset("general")
                      setDialogOpen(true)
                    }}
                    disabled={busy}
                    variant="outline"
                    className="rounded-xl border-white/25 bg-white/5 text-xs text-white hover:bg-white/10"
                  >
                    <Waves className="mr-1.5 h-3.5 w-3.5" />
                    Meeting
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={async () => connect(false)}
                  disabled={busy}
                  className="rounded-xl bg-white text-xs font-semibold text-slate-900 hover:bg-slate-100"
                >
                  <Link2 className="mr-1.5 h-3.5 w-3.5" />
                  Connect Google
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!status.connected && !connectionLoading && (
            <div className="border-b border-slate-100 px-4 py-3 text-xs text-blue-800 dark:border-slate-800 dark:bg-blue-950/30 dark:text-blue-200">
              Connect Google Calendar to schedule workspace meetings with Meet links.
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading meetings…
            </div>
          ) : upcomingOccurrences.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Video className="mx-auto mb-2 h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold">No upcoming meetings</p>
              <p className="mt-1 text-xs text-slate-500">Schedule a standup or meeting above.</p>
            </div>
          ) : (
            <ScrollArea className="h-[min(320px,45vh)] sm:h-[min(360px,40vh)]">
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {upcomingOccurrences.map((meeting) => (
                  <li
                    key={meeting.occurrenceKey}
                    className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 dark:hover:bg-slate-950/50"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-bold text-slate-900 dark:text-white">
                          {meeting.title}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {meeting.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {getMeetingRecurrenceLabel(meeting.recurrence)}
                        </Badge>
                        {meeting.meetCode && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {meeting.meetCode}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {format(meeting.occurrenceStart, "MMM d, p")} –{" "}
                        {format(meeting.occurrenceEnd, "p")} · {meeting.timezone}
                      </p>
                      {meeting.description && (
                        <p className="line-clamp-1 text-xs text-slate-600 dark:text-slate-400">
                          {meeting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {meeting.meetUri && (
                        <Button asChild size="sm" className="h-8 rounded-lg px-3 text-xs">
                          <Link href={meeting.meetUri} target="_blank" rel="noreferrer">
                            <Video className="mr-1 h-3.5 w-3.5" />
                            Join
                          </Link>
                        </Button>
                      )}
                      {meeting.calendarHtmlLink && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="h-8 rounded-lg px-3 text-xs"
                        >
                          <Link href={meeting.calendarHtmlLink} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Calendar
                          </Link>
                        </Button>
                      )}
                      {user?.id && meeting.organizerUserId === user.id && (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg px-3 text-xs"
                            onClick={() => {
                              setEditMeetingId(meeting.id)
                              setDialogOpen(true)
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-rose-200 px-3 text-xs text-rose-700 hover:bg-rose-50 dark:border-rose-900/60 dark:text-rose-400 dark:hover:bg-rose-950/40"
                            onClick={() => {
                              setPendingCancel({
                                id: meeting.id,
                                title: meeting.title,
                                recurring: !!meeting.recurrence?.enabled
                              })
                            }}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            {meeting.recurrence?.enabled ? "End series" : "Cancel"}
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <MeetingSchedulerDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) {
            setEditMeetingId(null)
          }
        }}
        onSuccess={() => {
          void refresh().finally(() => onMeetingsChanged?.())
        }}
        mode="organization"
        defaultPreset={dialogPreset}
        editMeetingId={editMeetingId}
      />

      <AlertDialog
        open={!!pendingCancel}
        onOpenChange={(open) => !open && !cancelling && setPendingCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingCancel?.recurring ? "End this recurring series?" : "Cancel this meeting?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span>
                This removes <strong>{pendingCancel?.title ?? "the meeting"}</strong> from Google
                Calendar (same account you used to create it) and marks it cancelled in the
                workspace.
              </span>
              {pendingCancel?.recurring ? (
                <span className="block text-slate-600 dark:text-slate-400">
                  For recurring meetings, the whole series is deleted—future occurrences will stop.
                </span>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling}
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => void confirmCancelMeeting()}
            >
              {cancelling
                ? "Removing…"
                : pendingCancel?.recurring
                  ? "End series"
                  : "Cancel meeting"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
