import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { FolderModel } from "@/models/folder.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    const { projectId } = await params
    await connectToDatabase()

    const folders = await FolderModel.find({ project: projectId }).sort({ name: 1 }).lean()

    return NextResponse.json(folders)
  } catch (error: any) {
    console.error("Get folders error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch folders" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const user = await UserModel.findById(decoded.userId).lean()
      if (user?.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const { projectId } = await params
    const { name } = await request.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Verify project access
    const project = await ProjectModel.findOne({ _id: projectId, organizationId })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check for duplicate name in this project
    const existing = await FolderModel.findOne({ project: projectId, name: name.trim() })
    if (existing) {
      return NextResponse.json(
        { error: `A folder named "${name}" already exists` },
        { status: 409 }
      )
    }

    const folder = await FolderModel.create({
      name: name.trim(),
      project: projectId,
      organizationId,
      createdBy: decoded.userId
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error: any) {
    console.error("Create folder error:", error)
    return NextResponse.json({ error: error.message || "Failed to create folder" }, { status: 500 })
  }
}
