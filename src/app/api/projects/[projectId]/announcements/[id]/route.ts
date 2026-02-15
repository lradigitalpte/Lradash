import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { AnnouncementModel } from "@/models/announcement.model"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { projectId, id } = await params
    const body = await request.json()

    await connectToDatabase()

    const announcement = await AnnouncementModel.findOne({
      _id: id,
      project: projectId
    })

    if (!announcement) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    // Update fields if present in body
    if (body.hasOwnProperty("isPinned")) {
      announcement.isPinned = body.isPinned
    }
    if (body.title) {
      announcement.title = body.title
    }
    if (body.content) {
      announcement.content = body.content
    }
    if (body.type) {
      announcement.type = body.type
    }
    if (body.tags) {
      announcement.tags = body.tags
    }

    // specific action for "viewing"
    if (body.action === "view") {
      // Ensure views is initialized
      if (!announcement.views) {
        announcement.views = []
      }

      // Check if user already viewed
      const alreadyViewed = announcement.views.some((id: any) => id.toString() === decoded.userId)
      if (!alreadyViewed) {
        announcement.views.push(decoded.userId)
      }
    }

    await announcement.save()

    const updatedAnnouncement = await AnnouncementModel.findById(id)
      .populate("author", "name email avatar")
      .lean()

    return NextResponse.json(updatedAnnouncement)
  } catch (error: any) {
    console.error("Update announcement error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update announcement" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { projectId, id } = await params
    await connectToDatabase()

    const result = await AnnouncementModel.deleteOne({
      _id: id,
      project: projectId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Announcement not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete announcement error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete announcement" },
      { status: 500 }
    )
  }
}
