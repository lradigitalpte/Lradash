import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import {
  deleteGoogleCalendarMeeting,
  extractMeetDetails,
  getActiveGoogleWorkspaceAccount,
  updateGoogleCalendarMeeting
} from "@/lib/google/workspace"
import { MeetingModel } from "@/models/meeting.model"
import { ProjectModel } from "@/models/project.model"
import { MeetingStatus, UserRole } from "@/types/dbInterface"

const attendeeSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).optional()
})

const updateMeetingSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  timezone: z.string().trim().min(1).optional(),
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { id } = await params
    const meeting = await MeetingModel.findOne({
      _id: id,
      organizationId: access.org._id
    }).lean()

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    return NextResponse.json(serializeMeeting(meeting))
  } catch (error) {
    console.error("Get meeting error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch meeting" },
      { status: 500 }
    )
  }
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
    const meeting = await MeetingModel.findOne({
      _id: id,
      organizationId: access.org._id
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (meeting.organizerUserId.toString() !== access.user._id) {
      return NextResponse.json(
        { error: "Only the organizer who connected Google can update this meeting" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = updateMeetingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid meeting payload", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    if (
      parsed.data.title === undefined &&
      parsed.data.description === undefined &&
      parsed.data.start_time === undefined &&
      parsed.data.end_time === undefined &&
      parsed.data.timezone === undefined &&
      parsed.data.attendees === undefined &&
      parsed.data.projectId === undefined
    ) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
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

    const nextStart = parsed.data.start_time
      ? toDate(parsed.data.start_time, "start_time")
      : meeting.startTime
    const nextEnd = parsed.data.end_time
      ? toDate(parsed.data.end_time, "end_time")
      : meeting.endTime
    const nextTimezone = parsed.data.timezone || meeting.timezone

    if (nextEnd <= nextStart) {
      return NextResponse.json({ error: "end_time must be after start_time" }, { status: 400 })
    }

    const googleAccess = await getActiveGoogleWorkspaceAccount(access, request)
    if (googleAccess.account._id.toString() !== meeting.googleAccountId.toString()) {
      return NextResponse.json(
        { error: "Reconnect the original Google account before updating this meeting" },
        { status: 409 }
      )
    }

    const googleEvent = await updateGoogleCalendarMeeting(
      googleAccess.accessToken,
      meeting.calendarEventId,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        startTime: parsed.data.start_time ? nextStart : undefined,
        endTime: parsed.data.end_time ? nextEnd : undefined,
        timezone:
          parsed.data.start_time || parsed.data.end_time || parsed.data.timezone
            ? nextTimezone
            : undefined,
        attendees: parsed.data.attendees
      }
    )
    const meetDetails = extractMeetDetails(googleEvent)

    meeting.title = parsed.data.title ?? meeting.title
    meeting.description = parsed.data.description ?? meeting.description
    meeting.startTime = nextStart
    meeting.endTime = nextEnd
    meeting.timezone = nextTimezone
    meeting.projectId =
      parsed.data.projectId === undefined ? meeting.projectId : parsed.data.projectId
    meeting.calendarHtmlLink = googleEvent.htmlLink || meeting.calendarHtmlLink
    meeting.meetUri = meetDetails.meetUri || meeting.meetUri
    meeting.meetCode = meetDetails.meetCode || meeting.meetCode

    if (parsed.data.attendees) {
      meeting.attendees = (googleEvent.attendees || parsed.data.attendees).map((attendee: any) => ({
        email: attendee.email,
        name: attendee.displayName || attendee.name || undefined,
        responseStatus: attendee.responseStatus || "needsAction"
      }))
    }

    await meeting.save()

    return NextResponse.json(serializeMeeting(meeting))
  } catch (error) {
    console.error("Update meeting error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update meeting" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    if (access.orgRole === UserRole.CLIENT) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const meeting = await MeetingModel.findOne({
      _id: id,
      organizationId: access.org._id
    })

    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 })
    }

    if (meeting.organizerUserId.toString() !== access.user._id) {
      return NextResponse.json(
        { error: "Only the organizer who connected Google can cancel this meeting" },
        { status: 403 }
      )
    }

    const googleAccess = await getActiveGoogleWorkspaceAccount(access, request)
    if (googleAccess.account._id.toString() !== meeting.googleAccountId.toString()) {
      return NextResponse.json(
        { error: "Reconnect the original Google account before cancelling this meeting" },
        { status: 409 }
      )
    }

    await deleteGoogleCalendarMeeting(googleAccess.accessToken, meeting.calendarEventId)

    meeting.status = MeetingStatus.CANCELLED
    meeting.cancelledAt = new Date()
    await meeting.save()

    return NextResponse.json({
      success: true,
      status: meeting.status,
      cancelledAt: meeting.cancelledAt
    })
  } catch (error) {
    console.error("Delete meeting error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel meeting" },
      { status: 500 }
    )
  }
}
