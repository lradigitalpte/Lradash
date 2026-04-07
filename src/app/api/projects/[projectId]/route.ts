import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { getTasksByProjectId } from "@/lib/db/task"
import { ProjectModel } from "@/models/project.model"
import { UserRole } from "@/types/dbInterface"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { projectId } = await params
    await connectToDatabase()

    const projectQuery: any = {
      _id: projectId,
      organizationId: access.org._id,
      deletedAt: null,
      $or:
        access.orgRole === UserRole.OWNER || access.orgRole === UserRole.ADMIN
          ? [{ owner: { $exists: true } }]
          : [{ owner: access.user._id }, { members: access.user._id }]
    }

    const project = await ProjectModel.findOne(projectQuery)
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
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { projectId } = await params
    await connectToDatabase()

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: access.org._id,
      deletedAt: null
    } as any)
      .select("owner")
      .lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const ownerId = (project as any).owner?.toString()
    const canManage =
      access.orgRole === UserRole.OWNER ||
      access.orgRole === UserRole.ADMIN ||
      ownerId === access.user._id

    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403 }
      )
    }

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
      { _id: projectId, organizationId: access.org._id, deletedAt: null } as any,
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
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { projectId } = await params
    await connectToDatabase()

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: access.org._id,
      deletedAt: null
    } as any)
      .select("owner")
      .lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const ownerId = (project as any).owner?.toString()
    const canDelete = access.orgRole === UserRole.OWNER || ownerId === access.user._id
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden: organization owner or project owner required" },
        { status: 403 }
      )
    }

    const deleted = await ProjectModel.findOneAndUpdate(
      { _id: projectId, organizationId: access.org._id, deletedAt: null } as any,
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
