import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { MinutesModel } from "@/models/minutes.model"
import { UserModel } from "@/models/user.model"

export async function GET(request: NextRequest) {
  try {
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

    // Org-global minutes feed (everyone in org can view)
    const minutes = await MinutesModel.find({
      organizationId: user.defaultOrganizationId,
      deletedAt: null
    })
      .populate("submittedBy.id", "name email avatar")
      .sort({ meetingDate: -1, createdAt: -1 })

    const enriched = minutes.map((m: any) => {
      const obj = m.toObject ? m.toObject() : m
      if (obj.submittedBy && typeof obj.submittedBy.id === "object") {
        obj.submittedBy.avatar = obj.submittedBy.id.avatar || obj.submittedBy.avatar
        obj.submittedBy.name = obj.submittedBy.id.name || obj.submittedBy.name
        obj.submittedBy.email = obj.submittedBy.id.email || obj.submittedBy.email
        obj.submittedBy.id = String(obj.submittedBy.id._id)
      }
      return obj
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error("Fetch minutes error:", error)
    return NextResponse.json({ error: "Failed to fetch minutes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json()
    const { title, description, meetingDate, fileUrl, fileName, fileType, fileSize } = body

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const minutes = await MinutesModel.create({
      title,
      description,
      meetingDate: meetingDate ? new Date(meetingDate) : undefined,
      organizationId: user.defaultOrganizationId,
      submittedBy: {
        id: (user as any)._id,
        name: (user as any).name,
        email: (user as any).email,
        avatar: (user as any).avatar
      },
      submittedAt: new Date(),
      fileType,
      fileUrl,
      fileName,
      fileSize: fileSize ?? "0 KB"
    })

    return NextResponse.json(minutes, { status: 201 })
  } catch (error) {
    console.error("Create minutes error:", error)
    return NextResponse.json({ error: "Failed to create minutes" }, { status: 500 })
  }
}
