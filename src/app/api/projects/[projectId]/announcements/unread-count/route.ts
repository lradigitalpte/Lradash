import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { AnnouncementModel } from "@/models/announcement.model"
import { ProjectModel } from "@/models/project.model"

/** GET: count of announcements in this project that the current user has not viewed (not in views array) */
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

    const userId = decoded.userId
    const { projectId } = await params
    await connectToDatabase()

    const project = await ProjectModel.findOne({ _id: projectId, deletedAt: null }).lean()
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null
    if (!userIdObj) {
      return NextResponse.json({ count: 0 })
    }
    // Announcements where current user is not in views array (unread)
    const count = await AnnouncementModel.countDocuments({
      project: projectId,
      views: { $ne: userIdObj }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error("Unread announcements count error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to get unread count" },
      { status: 500 }
    )
  }
}
