import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import MonitorModel from "@/models/monitor.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

async function getProjectMap(projectIds: string[]) {
  const ids = [...new Set(projectIds.filter(Boolean))]
  if (ids.length === 0) {return new Map<string, { _id: string; title: string }>()}
  const projects = await ProjectModel.find({ _id: { $in: ids } })
    .select("title")
    .lean()
  const map = new Map<string, { _id: string; title: string }>()
  for (const p of projects as any[]) {
    map.set(p._id.toString(), { _id: p._id.toString(), title: p.title })
  }
  return map
}

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
  if (decoded.organizationId) {return decoded.organizationId}
  const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
  return user?.defaultOrganizationId?.toString() ?? null
}

/** If projectId is set, validate it belongs to user's org. Returns sanitized projectId (object or null). */
async function validateProjectId(
  projectId: string | null | undefined,
  organizationId: string
): Promise<string | null> {
  if (!projectId) {return null}
  const project = await ProjectModel.findOne({
    _id: projectId,
    organizationId,
    deletedAt: null
  }).lean()
  return project ? projectId : null
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    if (!orgMemberIds?.length) {
      return NextResponse.json([])
    }
    const monitors = await MonitorModel.find({ userId: { $in: orgMemberIds } })
      .sort({ createdAt: -1 })
      .lean()

    const projectIds = (monitors as any[])
      .map((m) => m.projectId?.toString?.() ?? m.projectId)
      .filter(Boolean)
    const projectMap = await getProjectMap(projectIds)

    const list = (monitors as any[]).map((m) => {
      const pid = m.projectId?.toString?.() ?? m.projectId ?? null
      const project = pid ? (projectMap.get(pid) ?? null) : null
      return {
        ...m,
        _id: m._id.toString(),
        projectId: pid,
        project
      }
    })

    return NextResponse.json(list)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectToDatabase()

    const organizationId = await getOrganizationId(decoded)
    let projectId: string | null = null
    if (body.projectId) {
      projectId = organizationId ? await validateProjectId(body.projectId, organizationId) : null
    }

    const { projectId: _drop, ...rest } = body
    const monitor = await MonitorModel.create({
      ...rest,
      userId: decoded.userId,
      projectId: projectId || undefined,
      nextCheck: new Date() // Trigger check immediately
    })

    const created = await MonitorModel.findById(monitor._id).lean()
    const m = created as any
    const pid = m?.projectId?.toString?.() ?? m?.projectId ?? null
    const projectMap = pid ? await getProjectMap([pid]) : new Map()
    const project = pid ? (projectMap.get(pid) ?? null) : null
    return NextResponse.json(
      {
        ...m,
        _id: m._id.toString(),
        projectId: pid,
        project
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
