import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { DocumentModel } from "@/models/document.model"
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

    // Fetch documents for project
    const documents = await DocumentModel.find({
      project: projectId
    })
      .populate("uploader", "name email avatar")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error("Get documents error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
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
    const { name, type, size, folder, url } = body

    if (!name || !type || !size) {
      return NextResponse.json({ error: "Name, type, and size are required" }, { status: 400 })
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

    const newDocument = await DocumentModel.create({
      name,
      type,
      size,
      folder: folder || "General",
      url: url || "",
      project: projectId,
      uploader: decoded.userId,
      organizationId
    })

    const populatedDocument = await DocumentModel.findById(newDocument._id)
      .populate("uploader", "name email avatar")
      .lean()

    return NextResponse.json(populatedDocument, { status: 201 })
  } catch (error: any) {
    console.error("Create document error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create document" },
      { status: 500 }
    )
  }
}
