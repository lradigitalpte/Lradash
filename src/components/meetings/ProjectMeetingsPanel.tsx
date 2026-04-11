"use client"

import { format } from "date-fns"
import {
  CalendarCheck2,
  ExternalLink,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Users,
  Video,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { MeetingSchedulerDialog } from "@/components/meetings/MeetingSchedulerDialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useGoogleWorkspaceConnection } from "@/hooks/useGoogleWorkspaceConnection"
import { useMeetings } from "@/hooks/useMeetings"
import { apiClient } from "@/lib/api/client"
import { getMeetingRecurrenceLabel, getNextMeetingOccurrence } from "@/lib/meetings/recurrence"

interface ProjectMeetingsPanelProps {
  projectId: string
}

export function ProjectMeetingsPanel({ projectId }: ProjectMeetingsPanelProps) {
  const { user } = useAuth()
  const {
    loading: connectionLoading,
    busy,
    status,
    connect
  } = useGoogleWorkspaceConnection(projectId)
  const [cancelingId, setCancelingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMeetingId, setEditMeetingId] = useState<string | null>(null)
  const { loading, meetings, refresh } = useMeetings({ projectId })

  const upcomingMeetings = useMemo(() => {
    return meetings
      .map((meeting) => {
        const nextOccurrence = getNextMeetingOccurrence(meeting)
        return nextOccurrence ? { meeting, nextOccurrence } : null
      })
      .filter(Boolean)
      .slice(0, 5) as Array<{
      meeting: (typeof meetings)[number]
      nextOccurrence: ReturnType<typeof getNextMeetingOccurrence>
    }>
  }, [meetings])

  const handleCancelMeeting = async (meetingId: string) => {
    try {
      setCancelingId(meetingId)
      const response = await apiClient.delete(`/api/meetings/${meetingId}`)
      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || "Failed to cancel meeting")
      }

      toast.success("Meeting cancelled")
      refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel meeting")
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <>
      <Card className="rounded-[2.5rem] border-none bg-white shadow-2xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-none">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950">
                  <CalendarCheck2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Google Meet Meetings</CardTitle>
                  <CardDescription>
                    Schedule project calls, share Meet links, and keep upcoming sessions visible.
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {connectionLoading
                  ? "Checking connection"
                  : status.connected
                    ? `Connected: ${status.accountEmail || "Google account"}`
                    : "Google not connected"}
              </Badge>
              {status.connected ? (
                <Button
                  onClick={() => {
                    setEditMeetingId(null)
                    setDialogOpen(true)
                  }}
                  disabled={busy}
                  className="rounded-2xl bg-linear-to-r from-blue-600 to-indigo-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Meet
                </Button>
              ) : (
                <Button
                  onClick={ async () => connect(false)}
                  disabled={busy}
                  className="rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Google
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-8 pt-2">
          {!status.connected && !connectionLoading && (
            <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300">
              Connect Google first, then schedule calendar-backed Meet sessions for this project.
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading meetings...
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <div className="rounded-[2rem] border-2 border-dashed border-slate-100 bg-slate-50 py-16 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <Video className="mx-auto mb-4 h-10 w-10 text-slate-300" />
              <p className="text-lg font-black">No project meetings scheduled yet</p>
              <p className="mt-2 text-sm text-slate-500">
                Create the first session to generate a Google Meet link for your team.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {upcomingMeetings.map(({ meeting, nextOccurrence }) => (
                <div
                  key={meeting.id}
                  className="rounded-[2rem] border border-slate-200/60 bg-slate-50/60 p-5 dark:border-slate-800/60 dark:bg-slate-950/40"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{meeting.status}</Badge>
                        <Badge variant="outline">
                          {getMeetingRecurrenceLabel(meeting.recurrence)}
                        </Badge>
                        {meeting.meetCode && (
                          <Badge variant="outline">Code: {meeting.meetCode}</Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-black">{meeting.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {nextOccurrence
                            ? `${format(nextOccurrence.occurrenceStart, "PPP p")} to ${format(
                                nextOccurrence.occurrenceEnd,
                                "p"
                              )}`
                            : `${format(new Date(meeting.startTime), "PPP p")} to ${format(
                                new Date(meeting.endTime),
                                "p"
                              )}`}{" "}
                          · {meeting.timezone}
                        </p>
                      </div>
                      {meeting.description && (
                        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users className="h-4 w-4" />
                        {meeting.attendees.length} attendee
                        {meeting.attendees.length === 1 ? "" : "s"}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {meeting.meetUri && meeting.status !== "CANCELLED" && (
                        <Button asChild className="rounded-2xl">
                          <Link href={meeting.meetUri} target="_blank" rel="noreferrer">
                            <Video className="mr-2 h-4 w-4" />
                            Join
                          </Link>
                        </Button>
                      )}
                      {meeting.calendarHtmlLink && (
                        <Button asChild variant="outline" className="rounded-2xl">
                          <Link href={meeting.calendarHtmlLink} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Calendar
                          </Link>
                        </Button>
                      )}
                      {meeting.status !== "CANCELLED" && user?.id === meeting.organizerUserId && (
                        <Button
                          variant="outline"
                          className="rounded-2xl"
                          onClick={() => {
                            setEditMeetingId(meeting.id)
                            setDialogOpen(true)
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      )}
                      {meeting.status !== "CANCELLED" && (
                        <Button
                          variant="outline"
                          className="rounded-2xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={ async () => handleCancelMeeting(meeting.id)}
                          disabled={cancelingId === meeting.id}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {cancelingId === meeting.id ? "Cancelling..." : "Cancel"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
        onSuccess={refresh}
        projectId={projectId}
        mode="project"
        editMeetingId={editMeetingId}
      />
    </>
  )
}
