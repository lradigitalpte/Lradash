import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/db/connect"

interface CalendarEvent {
  _id?: string
  projectId: string
  clusterId: string
  clusterName: string
  title: string
  date: Date
  status: string
  notes?: string
}

const calendarEventSchema = new mongoose.Schema({
  projectId: String,
  clusterId: String,
  clusterName: String,
  title: String,
  date: Date,
  status: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const CalendarEvent =
  mongoose.models.CalendarEvent || mongoose.model("CalendarEvent", calendarEventSchema)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectToDatabase()
    const { projectId } = await params

    const events = await CalendarEvent.find({ projectId }).lean()

    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to fetch calendar events:", error)
    return NextResponse.json({ error: "Failed to fetch calendar events" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectToDatabase()
    const { projectId } = await params

    const body = await request.json()

    const event = new CalendarEvent({
      ...body,
      projectId,
      date: new Date(body.date)
    })

    await event.save()

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Failed to create calendar event:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectToDatabase()
    const { projectId } = await params

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const event = await CalendarEvent.findByIdAndUpdate(
      id,
      {
        ...body,
        date: new Date(body.date),
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error("Failed to update calendar event:", error)
    return NextResponse.json({ error: "Failed to update calendar event" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await connectToDatabase()
    const { projectId } = await params

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const event = await CalendarEvent.findByIdAndDelete(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete calendar event:", error)
    return NextResponse.json({ error: "Failed to delete calendar event" }, { status: 500 })
  }
}
