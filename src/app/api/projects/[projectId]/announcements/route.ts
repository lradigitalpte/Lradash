import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { createNotification } from "@/lib/db/notification"
import { AnnouncementModel } from "@/models/announcement.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params
    await connectToDatabase()

    // Fetch announcements for project
    const announcements = await AnnouncementModel.find({
      project: projectId
    })
      .populate("author", "name email avatar")
      .sort({ isPinned: -1, createdAt: -1 })
      .lean()

    return NextResponse.json(announcements)
  } catch (error: any) {
    console.error("Get announcements error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch announcements" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    const { title, content, type, tags, isPinned } = body

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Verify project existence and access
    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const newAnnouncement = await AnnouncementModel.create({
      title,
      content,
      type: type || "GENERAL",
      tags: tags || [],
      isPinned: isPinned || false,
      project: projectId,
      author: decoded.userId,
      organizationId,
      views: []
    })

    // Notify all project team (owner + members) except the author
    try {
      const projectWithMembers = await ProjectModel.findById(projectId)
        .select("owner members")
        .lean()
      const authorUser = await UserModel.findById(decoded.userId).select("name avatar").lean()
      const authorIdStr = decoded.userId.toString()
      const recipientIds = new Set<string>()
      if (projectWithMembers?.owner) {
        recipientIds.add((projectWithMembers.owner as any).toString())
      }
      ;(projectWithMembers?.members || []).forEach((m: any) => recipientIds.add(m.toString()))
      recipientIds.delete(authorIdStr)

      const authorName = (authorUser as any)?.name || "Someone"
      const authorAvatar = (authorUser as any)?.avatar

      for (const userId of recipientIds) {
        await createNotification({
          userId,
          type: "announcement_created",
          title: "New announcement",
          body: `${authorName}: ${title}`,
          projectId,
          triggeredBy: { userId: authorIdStr, name: authorName, avatar: authorAvatar }
        })
      }
    } catch (notifyErr) {
      console.error("Failed to send announcement notifications:", notifyErr)
      // Do not fail the request
    }

    const populatedAnnouncement = await AnnouncementModel.findById(newAnnouncement._id)
      .populate("author", "name email avatar")
      .lean()

    return NextResponse.json(populatedAnnouncement, { status: 201 })
  } catch (error: any) {
    console.error("Create announcement error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create announcement" },
      { status: 500 }
    )
  }
}
