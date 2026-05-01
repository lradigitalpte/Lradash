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
import { MeetingStatus, UserRole } from "@/types/dbInterface"

const attendeeSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).optional()
})

const editOccurrenceSchema = z.object({
  occurrence_start: z.string(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  start_time: z.string(),
  end_time: z.string(),
  timezone: z.string().trim().min(1),
  attendees: z.array(attendeeSchema).optional(),
  projectId: z.string().trim().min(1).nullable().optional()
})

function toDate(value: string, fieldName: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${fieldName}`)
  }
  return date
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    if (access.orgRole === UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const seriesMeeting = await MeetingModel.findOne({
      _id: id,
      organizationId: access.org._id
    })

    if (!seriesMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (seriesMeeting.organizerUserId.toString() !== access.user._id) {
      return NextResponse.json(
        { error: "Only the organizer who connected Google can edit this occurrence" },
        { status: 403 }
      )
    }

    if (!seriesMeeting.recurrence?.enabled) {
      return NextResponse.json(
        { error: "Single-occurrence edit is only for recurring meetings" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = editOccurrenceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid occurrence payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const occurrenceStart = toDate(parsed.data.occurrence_start, "occurrence_start")
    const startTime = toDate(parsed.data.start_time, "start_time")
    const endTime = toDate(parsed.data.end_time, "end_time")
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
    if (googleAccess.account._id.toString() !== seriesMeeting.googleAccountId.toString()) {
      return NextResponse.json(
        { error: "Reconnect the original Google account before editing this occurrence" },
        { status: 409 }
      )
    }

    const googleEvent = await createGoogleCalendarMeeting(googleAccess.accessToken, {
      title: parsed.data.title ?? seriesMeeting.title,
      description: parsed.data.description ?? seriesMeeting.description,
      startTime,
      endTime,
      timezone: parsed.data.timezone,
      attendees: parsed.data.attendees ?? seriesMeeting.attendees
    })
    const meetDetails = extractMeetDetails(googleEvent)

    const occurrenceMeeting = await MeetingModel.create({
      organizationId: seriesMeeting.organizationId,
      projectId:
        parsed.data.projectId === undefined ? seriesMeeting.projectId : parsed.data.projectId,
      organizerUserId: seriesMeeting.organizerUserId,
      googleAccountId: seriesMeeting.googleAccountId,
      title: parsed.data.title ?? seriesMeeting.title,
      description: parsed.data.description ?? seriesMeeting.description,
      startTime,
      endTime,
      timezone: parsed.data.timezone,
      status: MeetingStatus.SCHEDULED,
      calendarEventId: googleEvent.id,
      calendarHtmlLink: googleEvent.htmlLink || "",
      meetUri: meetDetails.meetUri,
      meetCode: meetDetails.meetCode,
      recurrence: null,
      attendees: (googleEvent.attendees || parsed.data.attendees || seriesMeeting.attendees).map(
        (attendee: any) => ({
          email: attendee.email,
          name: attendee.displayName || attendee.name || undefined,
          responseStatus: attendee.responseStatus || "needsAction"
        })
      )
    })

    const exceptions = Array.isArray(seriesMeeting.recurrence?.exceptions)
      ? [...seriesMeeting.recurrence.exceptions]
      : []
    const alreadyExcluded = exceptions.some((d: Date) => {
      const a = new Date(d)
      return (
        a.getUTCFullYear() === occurrenceStart.getUTCFullYear() &&
        a.getUTCMonth() === occurrenceStart.getUTCMonth() &&
        a.getUTCDate() === occurrenceStart.getUTCDate()
      )
    })
    if (!alreadyExcluded) {
      exceptions.push(occurrenceStart)
      seriesMeeting.recurrence = {
        ...seriesMeeting.recurrence,
        exceptions
      }
      await seriesMeeting.save()
    }

    return NextResponse.json({
      success: true,
      occurrenceMeetingId: occurrenceMeeting._id.toString()
    })
  } catch (error) {
    console.error("Edit meeting occurrence error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to edit occurrence" },
      { status: 500 }
    )
  }
}
