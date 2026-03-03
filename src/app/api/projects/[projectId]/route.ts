import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getTasksByProjectId } from "@/lib/db/task"
import { ProjectModel } from "@/models/project.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    const { projectId } = await params
    await connectToDatabase()

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: organizationId,
      deletedAt: null
    })
      .populate("owner", "name email avatar createdAt")
      .populate("members", "name email avatar createdAt")
      .lean()

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Fetch tasks for the project
    const tasks = await getTasksByProjectId(projectId)

    return NextResponse.json(
      {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        owner: project.owner,
        organizationId: project.organizationId.toString(),
        isArchived: project.isArchived,
        status: (project as any).status || "ACTIVE",
        priority: (project as any).priority || "MEDIUM",
        visibility: (project as any).visibility || "PRIVATE",
        notificationSettings: (project as any).notificationSettings || {
          email: false,
          assigned: true,
          mentions: true,
          deadlines: true,
          statusChanges: false,
          memberJoins: false,
          overdueAlerts: true
        },
        dueDate: (project as any).dueDate || null,
        members: project.members,
        tasks: tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PATCH(
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
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user?.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const { projectId } = await params
    await connectToDatabase()

    const body = await request.json()
    const allowedFields: Record<string, unknown> = {}

    if (body.title !== undefined) {
      allowedFields.title = body.title
    }
    if (body.description !== undefined) {
      allowedFields.description = body.description
    }
    if (body.visibility !== undefined) {
      allowedFields.visibility = body.visibility
    }
    if (body.status !== undefined) {
      allowedFields.status = body.status
    }
    if (body.priority !== undefined) {
      allowedFields.priority = body.priority
    }
    if (body.dueDate !== undefined) {
      allowedFields.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if (body.notificationSettings !== undefined) {
      allowedFields.notificationSettings = body.notificationSettings
    }

    const updated = await ProjectModel.findOneAndUpdate(
      { _id: projectId, organizationId, deletedAt: null },
      { $set: allowedFields },
      { new: true }
    )
      .populate("owner", "name email avatar")
      .lean()

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: updated._id.toString(),
      title: updated.title,
      description: updated.description,
      status: (updated as any).status || "ACTIVE",
      priority: (updated as any).priority || "MEDIUM",
      visibility: (updated as any).visibility || "PRIVATE",
      notificationSettings: (updated as any).notificationSettings,
      dueDate: (updated as any).dueDate || null,
      owner: updated.owner,
      isArchived: updated.isArchived,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt
    })
  } catch (error) {
    console.error("PATCH project error:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

export async function DELETE(
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
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user?.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const { projectId } = await params
    await connectToDatabase()

    const deleted = await ProjectModel.findOneAndUpdate(
      { _id: projectId, organizationId, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    )

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE project error:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}
