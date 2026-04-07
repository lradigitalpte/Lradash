import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { MarketingReportModel } from "@/models/marketing-report.model"
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

    const reports = await MarketingReportModel.find({ projectId }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(
      reports.map((r) => ({
        id: r._id.toString(),
        projectId: r.projectId.toString(),
        name: r.name,
        selectedMetrics: r.selectedMetrics,
        createdBy: r.createdBy.toString(),
        sharedWith: r.sharedWith.map((id) => id.toString()),
        isPublic: r.isPublic,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get reports error:", error)
    return NextResponse.json(
      { error: "Failed to fetch reports" },
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
    const { name, selectedMetrics, sharedWith, isPublic } = body

    if (!name || !selectedMetrics) {
      return NextResponse.json(
        { error: "Name and selectedMetrics are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const report = await MarketingReportModel.create({
      projectId,
      name,
      selectedMetrics,
      createdBy: auth.access.user._id,
      sharedWith: sharedWith || [],
      isPublic: isPublic || false
    })

    return NextResponse.json(
      {
        id: report._id.toString(),
        projectId: report.projectId.toString(),
        name: report.name,
        selectedMetrics: report.selectedMetrics,
        createdBy: report.createdBy.toString(),
        sharedWith: report.sharedWith.map((id) => id.toString()),
        isPublic: report.isPublic,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create report error:", error)
    return NextResponse.json(
      { error: "Failed to create report" },
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

    const { searchParams } = new URL(request.url)
    const reportId = searchParams.get("reportId")

    if (!reportId) {
      return NextResponse.json(
        { error: "reportId is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const deleteQuery: any = {
      _id: reportId,
      projectId
    }

    if (!auth.canWrite) {
      deleteQuery.createdBy = auth.access.user._id
    }

    const result = await MarketingReportModel.deleteOne(deleteQuery)

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Report not found or unauthorized" },
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
    console.error("Delete report error:", error)
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
