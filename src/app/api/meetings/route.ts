import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import {
  createGoogleCalendarMeeting,
  extractMeetDetails,
  getActiveGoogleWorkspaceAccount
} from "@/lib/google/workspace"
import { MeetingModel } from "@/models/meeting.model"
import { ProjectModel } from "@/models/project.model"
import { MeetingRecurrenceFrequency, MeetingStatus, UserRole } from "@/types/dbInterface"

const attendeeSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).optional()
})

const recurrenceSchema = z
  .object({
    enabled: z.boolean().default(false),
    frequency: z.nativeEnum(MeetingRecurrenceFrequency).optional(),
    interval: z.number().int().min(1).default(1),
    weekdays: z.array(z.string().trim().min(2).max(2)).default([]),
    until: z.string().optional()
  })
  .optional()

const createMeetingSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  start_time: z.string(),
  end_time: z.string(),
  timezone: z.string().trim().min(1),
  attendees: z.array(attendeeSchema).default([]),
  projectId: z.string().trim().min(1).optional(),
  recurrence: recurrenceSchema
})

function toDate(value: string, fieldName: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`)
  }

  return date
}

function serializeMeeting(meeting: any) {
  return {
    id: meeting._id.toString(),
    organizationId: meeting.organizationId.toString(),
    projectId: meeting.projectId?.toString() || null,
    organizerUserId: meeting.organizerUserId.toString(),
    googleAccountId: meeting.googleAccountId.toString(),
    title: meeting.title,
    description: meeting.description || "",
    startTime: meeting.startTime,
    endTime: meeting.endTime,
    timezone: meeting.timezone,
    status: meeting.status,
    calendarEventId: meeting.calendarEventId,
    calendarHtmlLink: meeting.calendarHtmlLink || null,
    meetUri: meeting.meetUri || null,
    meetCode: meeting.meetCode || null,
    recurrence: meeting.recurrence || null,
    attendees: meeting.attendees || [],
    cancelledAt: meeting.cancelledAt || null,
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt
  }
}

function normalizeRecurrence(recurrence?: z.infer<typeof recurrenceSchema>) {
  if (!recurrence?.enabled) {
    return null
  }

  if (!recurrence.frequency) {
    throw new Error("recurrence.frequency is required when recurrence is enabled")
  }

  const normalizedWeekdays = (recurrence.weekdays || []).map((weekday) => weekday.toUpperCase())

  if (
    recurrence.frequency === MeetingRecurrenceFrequency.WEEKLY &&
    normalizedWeekdays.length === 0
  ) {
    throw new Error("recurrence.weekdays is required for weekly recurring meetings")
  }

  return {
    enabled: true,
    frequency: recurrence.frequency,
    interval: recurrence.interval || 1,
    weekdays: normalizedWeekdays,
    until: recurrence.until ? toDate(recurrence.until, "recurrence.until") : undefined
  }
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const projectId = searchParams.get("projectId")
    const organizer = searchParams.get("organizer")
    const from = searchParams.get("from")

    const query: Record<string, unknown> = {
      organizationId: access.org._id
    }

    if (status) {
      if (!Object.values(MeetingStatus).includes(status as MeetingStatus)) {
        return NextResponse.json({ error: "Invalid meeting status" }, { status: 400 })
      }

      query.status = status
    }

    if (projectId) {
      query.projectId = projectId
    }

    if (organizer === "me") {
      query.organizerUserId = access.user._id
    }

    if (from) {
      const fromDate = toDate(from, "from date")
      query.$or = [{ startTime: { $gte: fromDate } }, { "recurrence.enabled": true }]
    }

    const meetings = await MeetingModel.find(query).sort({ startTime: 1 }).lean()

    return NextResponse.json(meetings.map(serializeMeeting))
  } catch (error) {
    console.error("Get meetings error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch meetings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    if (access.orgRole === UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createMeetingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid meeting payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const startTime = toDate(parsed.data.start_time, "start_time")
    const endTime = toDate(parsed.data.end_time, "end_time")
    const recurrence = normalizeRecurrence(parsed.data.recurrence)

    if (endTime <= startTime) {
      return NextResponse.json({ error: "end_time must be after start_time" }, { status: 400 })
    }

    if (parsed.data.projectId) {
      const project = await ProjectModel.findOne({
        _id: parsed.data.projectId,
        organizationId: access.org._id,
        deletedAt: null
      }).lean()

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
    }

    const googleAccess = await getActiveGoogleWorkspaceAccount(access, request)
    const googleEvent = await createGoogleCalendarMeeting(googleAccess.accessToken, {
      title: parsed.data.title,
      description: parsed.data.description,
      startTime,
      endTime,
      timezone: parsed.data.timezone,
      attendees: parsed.data.attendees,
      recurrence: recurrence || undefined
    })
    const meetDetails = extractMeetDetails(googleEvent)

    const meeting = await MeetingModel.create({
      organizationId: access.org._id,
      projectId: parsed.data.projectId || null,
      organizerUserId: access.user._id,
      googleAccountId: googleAccess.account._id,
      title: parsed.data.title,
      description: parsed.data.description || "",
      startTime,
      endTime,
      timezone: parsed.data.timezone,
      status: MeetingStatus.SCHEDULED,
      calendarEventId: googleEvent.id,
      calendarHtmlLink: googleEvent.htmlLink || "",
      meetUri: meetDetails.meetUri,
      meetCode: meetDetails.meetCode,
      recurrence,
      attendees: (googleEvent.attendees || parsed.data.attendees).map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName || attendee.name || undefined,
        responseStatus: attendee.responseStatus || "needsAction"
      }))
    })

    return NextResponse.json(serializeMeeting(meeting), { status: 201 })
  } catch (error) {
    console.error("Create meeting error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create meeting" },
      { status: 500 }
    )
  }
}
