import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { ContentClusterModel } from "@/models/content-cluster.model"
import { ProjectModel } from "@/models/project.model"
import { UserRole } from "@/types/dbInterface"

async function ensureProjectAccess(projectId: string, request: NextRequest) {
  const access = await requireOrganizationAccess(request)
  if ("error" in access) {
    return access
  }

  await connectToDatabase()

  const project = await ProjectModel.findOne({
    _id: projectId,
    organizationId: access.org._id,
    deletedAt: null
  } as any)
    .select("owner members")
    .lean()

  if (!project) {
    return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) }
  }

  const ownerId = (project as any).owner?.toString()
  const memberIds = new Set(((project as any).members || []).map((id: any) => id.toString()))
  const hasReadAccess =
    access.orgRole === UserRole.OWNER ||
    access.orgRole === UserRole.ADMIN ||
    ownerId === access.user._id ||
    memberIds.has(access.user._id)

  if (!hasReadAccess) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  const canWrite =
    access.orgRole === UserRole.OWNER ||
    access.orgRole === UserRole.ADMIN ||
    ownerId === access.user._id

  return {
    access,
    canWrite
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const auth = await ensureProjectAccess(projectId, request)
    if ("error" in auth) {
      return auth.error
    }

    const clusters = await ContentClusterModel.find({ projectId }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      clusters.map((c) => ({
        id: c._id.toString(),
        projectId: c.projectId.toString(),
        name: c.name,
        subtopics: c.subtopics,
        authorityScore: c.authorityScore,
        status: c.status,
        pillarPageUrl: c.pillarPageUrl,
        createdBy: c.createdBy.toString(),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get clusters error:", error)
    return NextResponse.json(
      { error: "Failed to fetch clusters" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const auth = await ensureProjectAccess(projectId, request)
    if ("error" in auth) {
      return auth.error
    }
    if (!auth.canWrite) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { name, subtopics, pillarPageUrl } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const cluster = await ContentClusterModel.create({
      projectId,
      name,
      subtopics: subtopics || [],
      pillarPageUrl,
      createdBy: auth.access.user._id
    })

    return NextResponse.json(
      {
        id: cluster._id.toString(),
        projectId: cluster.projectId.toString(),
        name: cluster.name,
        subtopics: cluster.subtopics,
        authorityScore: cluster.authorityScore,
        status: cluster.status,
        pillarPageUrl: cluster.pillarPageUrl,
        createdBy: cluster.createdBy.toString(),
        createdAt: cluster.createdAt,
        updatedAt: cluster.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create cluster error:", error)
    return NextResponse.json(
      { error: "Failed to create cluster" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const auth = await ensureProjectAccess(projectId, request)
    if ("error" in auth) {
      return auth.error
    }
    if (!auth.canWrite) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { clusterId, name, subtopics, authorityScore, status, pillarPageUrl } = body

    if (!clusterId) {
      return NextResponse.json(
        { error: "clusterId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = name
    }
    if (subtopics !== undefined) {
      updateData.subtopics = subtopics
    }
    if (authorityScore !== undefined) {
      updateData.authorityScore = authorityScore
    }
    if (status !== undefined) {
      updateData.status = status
    }
    if (pillarPageUrl !== undefined) {
      updateData.pillarPageUrl = pillarPageUrl
    }

    const cluster = await ContentClusterModel.findOneAndUpdate(
      { _id: clusterId, projectId },
      updateData,
      { new: true }
    )

    if (!cluster) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: cluster._id.toString(),
        projectId: cluster.projectId.toString(),
        name: cluster.name,
        subtopics: cluster.subtopics,
        authorityScore: cluster.authorityScore,
        status: cluster.status,
        pillarPageUrl: cluster.pillarPageUrl,
        createdAt: cluster.createdAt,
        updatedAt: cluster.updatedAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Update cluster error:", error)
    return NextResponse.json(
      { error: "Failed to update cluster" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const auth = await ensureProjectAccess(projectId, request)
    if ("error" in auth) {
      return auth.error
    }
    if (!auth.canWrite) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403, headers: { "Content-Type": "application/json" } }
      )
    }

    const { searchParams } = new URL(request.url)
    const clusterId = searchParams.get("clusterId")

    if (!clusterId) {
      return NextResponse.json(
        { error: "clusterId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const result = await ContentClusterModel.deleteOne({ _id: clusterId, projectId })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Cluster not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Delete cluster error:", error)
    return NextResponse.json(
      { error: "Failed to delete cluster" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
