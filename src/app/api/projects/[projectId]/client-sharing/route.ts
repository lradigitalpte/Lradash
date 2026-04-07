import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

function toIdString(value: unknown): string {
  if (!value) {
    return ""
  }
  if (typeof value === "string") {
    return value
  }
  if (typeof value === "object" && value !== null && "toString" in value) {
    return String((value as { toString: () => string }).toString())
  }
  return ""
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const access = await requireOrganizationAccess(request)
  if ("error" in access) {
    return access.error
  }

  try {
    await connectToDatabase()
    const { projectId } = await params

    const projectQuery: any = {
      _id: projectId,
      organizationId: new mongoose.Types.ObjectId(access.org._id),
      deletedAt: null
    }

    const project = await ProjectModel.findOne(projectQuery)
      .select("_id owner members title")
      .lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const ownerId = toIdString((project as any).owner)
    const memberIds = new Set(((project as any).members || []).map((id: any) => toIdString(id)))
    const isProjectMember = access.user._id === ownerId || memberIds.has(access.user._id)

    if (
      !isProjectMember &&
      access.orgRole !== UserRole.OWNER &&
      access.orgRole !== UserRole.ADMIN
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const organization = await OrganizationModel.findById(access.org._id).select("members").lean()

    const clientMemberIds = ((organization as any)?.members || [])
      .filter((member: any) => member.role === UserRole.CLIENT)
      .map((member: any) => toIdString(member.userId))

    const availableClients = clientMemberIds.length
      ? await UserModel.find({
          _id: { $in: clientMemberIds },
          deletedAt: null,
          status: "ACTIVE"
        })
          .select("_id name email avatar")
          .sort({ name: 1 })
          .lean()
      : []

    const selectedClientIds = clientMemberIds.filter((id: string) => memberIds.has(id))

    return NextResponse.json({
      projectId,
      availableClients: availableClients.map((client: any) => ({
        _id: toIdString(client._id),
        name: client.name,
        email: client.email,
        avatar: client.avatar
      })),
      selectedClientIds,
      sharedCount: selectedClientIds.length
    })
  } catch (error) {
    console.error("Get project client sharing error:", error)
    return NextResponse.json({ error: "Failed to fetch project client sharing" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const access = await requireOrganizationAccess(request)
  if ("error" in access) {
    return access.error
  }

  try {
    await connectToDatabase()
    const { projectId } = await params
    const body = await request.json().catch(() => ({}))
    const rawClientIds = Array.isArray(body.clientIds) ? body.clientIds : []
    const requestedClientIds: string[] = Array.from(new Set(rawClientIds)).filter(
      (id): id is string => typeof id === "string"
    )

    const projectQuery: any = {
      _id: projectId,
      organizationId: new mongoose.Types.ObjectId(access.org._id),
      deletedAt: null
    }

    const project = await ProjectModel.findOne(projectQuery).select("_id owner members").lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const ownerId = toIdString((project as any).owner)
    const canManage =
      access.orgRole === UserRole.OWNER ||
      access.orgRole === UserRole.ADMIN ||
      access.user._id === ownerId

    if (!canManage) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403 }
      )
    }

    const organization = await OrganizationModel.findById(access.org._id).select("members").lean()

    const orgClientIds = new Set(
      ((organization as any)?.members || [])
        .filter((member: any) => member.role === UserRole.CLIENT)
        .map((member: any) => toIdString(member.userId))
    )

    const invalidClientIds = requestedClientIds.filter((id: string) => !orgClientIds.has(id))
    if (invalidClientIds.length > 0) {
      return NextResponse.json(
        {
          error: "Some selected users are not client members of this organization",
          invalidClientIds
        },
        { status: 400 }
      )
    }

    const currentMemberIds = ((project as any).members || []).map((id: any) => toIdString(id))
    const preservedNonClientMemberIds = currentMemberIds.filter(
      (id: string) => !orgClientIds.has(id)
    )

    const mergedIds = [...new Set([...preservedNonClientMemberIds, ...requestedClientIds, ownerId])]

    const updateQuery: any = {
      _id: projectId,
      organizationId: new mongoose.Types.ObjectId(access.org._id),
      deletedAt: null
    }

    await ProjectModel.updateOne(updateQuery, {
      $set: { members: mergedIds.map((id) => new mongoose.Types.ObjectId(id)) }
    })

    return NextResponse.json({
      success: true,
      projectId,
      selectedClientIds: requestedClientIds,
      sharedCount: requestedClientIds.length
    })
  } catch (error) {
    console.error("Update project client sharing error:", error)
    return NextResponse.json({ error: "Failed to update project client sharing" }, { status: 500 })
  }
}
