"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { apiClient } from "@/lib/api/client"
import {
  getMeetingOccurrencesBetween,
  getNextMeetingOccurrence,
  type MeetingOccurrence
} from "@/lib/meetings/recurrence"

export interface MeetingRecord {
  id: string
  organizerUserId: string
  title: string
  description?: string
  startTime: string
  endTime: string
  timezone: string
  status: string
  meetUri?: string | null
  meetCode?: string | null
  calendarHtmlLink?: string | null
  recurrence?: {
    enabled?: boolean
    frequency?: "DAILY" | "WEEKLY"
    interval?: number
    weekdays?: string[]
    until?: string | null
  } | null
  attendees: Array<{ email: string }>
}

interface UseMeetingsOptions {
  projectId?: string
  includePastWindowHours?: number
}

export function useMeetings(options: UseMeetingsOptions = {}) {
  const { projectId, includePastWindowHours = 24 } = options
  const [loading, setLoading] = useState(true)
  const [meetings, setMeetings] = useState<MeetingRecord[]>([])

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set(
        "from",
        new Date(Date.now() - includePastWindowHours * 60 * 60 * 1000).toISOString()
      )

      if (projectId) {
        params.set("projectId", projectId)
      }

      const response = await apiClient.get(`/api/meetings?${params.toString()}`)
      const data = await response.json().catch(() => [])

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load meetings")
      }

      setMeetings(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load meetings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load meetings")
    } finally {
      setLoading(false)
    }
  }, [includePastWindowHours, projectId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const cancelMeeting = useCallback(
    async (id: string) => {
      const response = await apiClient.delete(`/api/meetings/${id}`)
      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "Failed to cancel meeting")
      }
      await refresh()
      return data
    },
    [refresh]
  )

  const nextOccurrences = useMemo(() => {
    return meetings.map((meeting) => getNextMeetingOccurrence(meeting)).filter(Boolean) as Array<
      MeetingOccurrence<MeetingRecord>
    >
  }, [meetings])

  return {
    loading,
    meetings,
    refresh,
    cancelMeeting,
    nextOccurrences,
    getOccurrencesBetween: (start: Date, end: Date) =>
      getMeetingOccurrencesBetween(meetings, start, end)
  }
}
