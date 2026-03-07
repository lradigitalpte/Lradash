import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import CostLineItemModel from "@/models/cost-line-item.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"
import { CostFrequency, CostLineItemType } from "@/types/cost-line-item"

async function getOrganizationId(decoded: {
  userId: string
  organizationId?: string
}): Promise<string | null> {
  if (decoded.organizationId) {return decoded.organizationId}
  const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
  return user?.defaultOrganizationId?.toString() ?? null
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { projectId, id } = await params
    const body = await request.json()

    await connectToDatabase()

    const organizationId = await getOrganizationId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId,
      deletedAt: null
    })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const existing = await CostLineItemModel.findOne({ _id: id, projectId, organizationId })
    if (!existing) {
      return NextResponse.json({ error: "Cost line item not found" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (body.type != null) {
      if (!Object.values(CostLineItemType).includes(body.type)) {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 })
      }
      updates.type = body.type
    }
    if (body.name != null) {updates.name = body.name}
    if (body.amount != null) {updates.amount = Number(body.amount)}
    if (body.currency != null) {updates.currency = body.currency}
    if (body.frequency != null) {
      if (!Object.values(CostFrequency).includes(body.frequency)) {
        return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
      }
      updates.frequency = body.frequency
    }
    if (body.dueDate !== undefined) {updates.dueDate = body.dueDate ? new Date(body.dueDate) : null}
    if (body.expiryDate !== undefined)
      {updates.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null}
    if (body.monitorId !== undefined) {updates.monitorId = body.monitorId || null}
    if (body.notes !== undefined) {updates.notes = body.notes}

    const updated = await CostLineItemModel.findByIdAndUpdate(id, updates, { new: true }).lean()
    if (!updated) {
      return NextResponse.json({ error: "Cost line item not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: updated._id.toString(),
      projectId: (updated as any).projectId.toString(),
      organizationId: (updated as any).organizationId.toString(),
      type: (updated as any).type,
      name: (updated as any).name,
      amount: (updated as any).amount,
      currency: (updated as any).currency,
      frequency: (updated as any).frequency,
      dueDate: (updated as any).dueDate,
      expiryDate: (updated as any).expiryDate,
      monitorId: (updated as any).monitorId?.toString(),
      notes: (updated as any).notes,
      createdAt: (updated as any).createdAt,
      updatedAt: (updated as any).updatedAt
    })
  } catch (error: any) {
    console.error("Update project cost error:", error)
    return NextResponse.json({ error: error.message || "Failed to update cost" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { projectId, id } = await params
    await connectToDatabase()

    const organizationId = await getOrganizationId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId,
      deletedAt: null
    })
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const result = await CostLineItemModel.findOneAndDelete({ _id: id, projectId, organizationId })
    if (!result) {
      return NextResponse.json({ error: "Cost line item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete project cost error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete cost" }, { status: 500 })
  }
}
