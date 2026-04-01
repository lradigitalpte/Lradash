import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { MinutesModel } from "@/models/minutes.model"
import { UserModel } from "@/models/user.model"

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId).lean()
    if (!user?.defaultOrganizationId) {
      return NextResponse.json({ error: "No organization set" }, { status: 400 })
    }

    const minutes = await MinutesModel.findById(id)
    if (!minutes) {
      return NextResponse.json({ error: "Minutes not found" }, { status: 404 })
    }

    if (minutes.organizationId.toString() !== user.defaultOrganizationId.toString()) {
      return NextResponse.json(
        { error: "Minutes do not belong to your organization" },
        { status: 403 }
      )
    }

    if (minutes.submittedBy.id.toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: "You can only delete your own minutes" }, { status: 403 })
    }

    minutes.deletedAt = new Date()
    await minutes.save()

    return NextResponse.json({ success: true, message: "Minutes deleted successfully" })
  } catch (error) {
    console.error("Delete minutes error:", error)
    return NextResponse.json({ error: "Failed to delete minutes" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const user = await UserModel.findById(decoded.userId).lean()
    if (!user?.defaultOrganizationId) {
      return NextResponse.json({ error: "No organization set" }, { status: 400 })
    }

    const minutes = await MinutesModel.findById(id)
    if (!minutes) {
      return NextResponse.json({ error: "Minutes not found" }, { status: 404 })
    }

    if (minutes.organizationId.toString() !== user.defaultOrganizationId.toString()) {
      return NextResponse.json(
        { error: "Minutes do not belong to your organization" },
        { status: 403 }
      )
    }

    if (minutes.submittedBy.id.toString() !== (user as any)._id.toString()) {
      return NextResponse.json({ error: "You can only update your own minutes" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, meetingDate, fileUrl, fileName, fileType, fileSize } = body

    if (title !== undefined) {
      minutes.title = title
    }
    if (description !== undefined) {
      minutes.description = description
    }
    if (meetingDate !== undefined) {
      minutes.meetingDate = meetingDate ? new Date(meetingDate) : undefined
    }
    if (fileUrl !== undefined) {
      minutes.fileUrl = fileUrl
    }
    if (fileName !== undefined) {
      minutes.fileName = fileName
    }
    if (fileType !== undefined) {
      minutes.fileType = fileType
    }
    if (fileSize !== undefined) {
      minutes.fileSize = fileSize
    }

    minutes.submittedAt = new Date()
    const updated = await minutes.save()

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update minutes error:", error)
    return NextResponse.json({ error: "Failed to update minutes" }, { status: 500 })
  }
}
