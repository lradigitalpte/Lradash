import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const projects = await ProjectModel.find({
      organizationId: organizationId,
      deletedAt: null
    })
      .populate("owner", "name email")
      .lean()

    return NextResponse.json(
      projects.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        description: p.description,
        owner: p.owner,
        organizationId: p.organizationId.toString(),
        isArchived: p.isArchived,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, dueDate, memberIds } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Build project data
    const projectData: any = {
      title,
      description: description || "",
      organizationId: organizationId,
      owner: decoded.userId,
      members: [decoded.userId] // Owner is always a member
    }

    // Add dueDate if provided
    if (dueDate) {
      projectData.dueDate = new Date(dueDate)
    }

    // Add additional members if provided
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      // Use unique IDs to avoid duplicates (ensure strings are compared correctly)
      const allMemberIds = [decoded.userId, ...memberIds].map((id) => id.toString())
      const uniqueMemberIds = Array.from(new Set(allMemberIds))
      projectData.members = uniqueMemberIds
    }

    const project: any = await ProjectModel.create(projectData)

    return NextResponse.json(
      {
        id: project._id.toString(),
        title: project.title,
        description: project.description,
        dueDate: project.dueDate,
        members: project.members,
        organizationId: project.organizationId.toString(),
        owner: decoded.userId
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
