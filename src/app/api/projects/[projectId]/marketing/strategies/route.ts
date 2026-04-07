import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { UserRole } from "@/types/dbInterface"

interface SocialStrategy {
  _id?: string
  projectId: string
  type: string
  title: string
  description?: string
  status: string
  platforms: string[]
  targetAudience?: string
  implementationSteps?: string[]
  metrics?: {
    targetReach?: number
    targetEngagement?: number
    targetROI?: number
  }
  createdAt?: Date
  updatedAt?: Date
}

const socialStrategySchema = new mongoose.Schema({
  projectId: String,
  type: String,
  title: String,
  description: String,
  status: String,
  platforms: [String],
  targetAudience: String,
  implementationSteps: [String],
  metrics: {
    targetReach: Number,
    targetEngagement: Number,
    targetROI: Number
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const SocialStrategy =
  mongoose.models.SocialStrategy || mongoose.model("SocialStrategy", socialStrategySchema)

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

    const strategies = await SocialStrategy.find({ projectId }).lean()

    return NextResponse.json({ strategies })
  } catch (error) {
    console.error("Failed to fetch strategies:", error)
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 })
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
        { status: 403 }
      )
    }

    const body = await request.json()

    const strategy = new SocialStrategy({
      ...body,
      projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await strategy.save()

    return NextResponse.json(strategy, { status: 201 })
  } catch (error) {
    console.error("Failed to create strategy:", error)
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 })
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
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Strategy ID is required" }, { status: 400 })
    }

    const strategy = await SocialStrategy.findByIdAndUpdate(
      id,
      {
        ...body,
        updatedAt: new Date()
      },
      { new: true }
    )

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json(strategy)
  } catch (error) {
    console.error("Failed to update strategy:", error)
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 })
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
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Strategy ID is required" }, { status: 400 })
    }

    const strategy = await SocialStrategy.findByIdAndDelete(id)

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete strategy:", error)
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 })
  }
}
