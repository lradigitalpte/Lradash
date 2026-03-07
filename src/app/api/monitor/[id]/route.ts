import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import MonitorModel from "@/models/monitor.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  const token = authHeader.substring(7)
  const decoded = verifyAccessToken(token)
  return decoded
}

async function getOrganizationId(decoded: {
  userId: string
  organizationId?: string
}): Promise<string | null> {
  if (decoded.organizationId) {
    return decoded.organizationId
  }
  const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
  return user?.defaultOrganizationId?.toString() ?? null
}

async function validateProjectId(
  projectId: string | null | undefined,
  organizationId: string
): Promise<string | null> {
  if (!projectId) {
    return null
  }
  const project = await ProjectModel.findOne({
    _id: projectId,
    organizationId,
    deletedAt: null
  }).lean()
  return project ? projectId : null
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const existing = await MonitorModel.findById(id).lean()
    if (!existing) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }
    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    const existingUserId = (existing as any).userId?.toString?.() ?? (existing as any).userId
    if (!orgMemberIds?.length || !existingUserId || !orgMemberIds.includes(existingUserId)) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const body = await request.json()
    let projectId: string | null | undefined = body.projectId
    if (projectId !== undefined) {
      const organizationId = await getOrganizationId(decoded)
      projectId = organizationId ? await validateProjectId(projectId, organizationId) : null
    }
    const { projectId: _drop, ...rest } = body
    const updatePayload = projectId !== undefined ? { ...rest, projectId: projectId || null } : rest
    const monitor = await MonitorModel.findByIdAndUpdate(id, updatePayload, { new: true }).lean()

    const m = monitor as any
    const pid = m?.projectId?.toString?.() ?? m?.projectId ?? null
    let project: { _id: string; title: string } | null = null
    if (pid) {
      const proj = await ProjectModel.findById(pid).select("title").lean()
      if (proj) {
        project = { _id: (proj as any)._id.toString(), title: (proj as any).title }
      }
    }
    return NextResponse.json({
      ...m,
      _id: m._id.toString(),
      projectId: pid,
      project
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const existing = await MonitorModel.findById(id).lean()
    if (!existing) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }
    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    const existingUserId = (existing as any).userId?.toString?.() ?? (existing as any).userId
    if (!orgMemberIds?.length || !existingUserId || !orgMemberIds.includes(existingUserId)) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    await MonitorModel.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
