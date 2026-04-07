import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import CostLineItemModel from "@/models/cost-line-item.model"
import { ProjectModel } from "@/models/project.model"
import { CostFrequency, CostLineItemType } from "@/types/cost-line-item"
import { UserRole } from "@/types/dbInterface"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; id: string }> }
) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { projectId, id } = await params
    const body = await request.json()

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
    const canManageCosts =
      access.orgRole === UserRole.OWNER ||
      access.orgRole === UserRole.ADMIN ||
      ownerId === access.user._id
    if (!canManageCosts) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403 }
      )
    }

    const existing = await CostLineItemModel.findOne({
      _id: id,
      projectId,
      organizationId: access.org._id
    })
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
    if (body.name != null) {
      updates.name = body.name
    }
    if (body.amount != null) {
      updates.amount = Number(body.amount)
    }
    if (body.currency != null) {
      updates.currency = body.currency
    }
    if (body.frequency != null) {
      if (!Object.values(CostFrequency).includes(body.frequency)) {
        return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
      }
      updates.frequency = body.frequency
    }
    if (body.dueDate !== undefined) {
      updates.dueDate = body.dueDate ? new Date(body.dueDate) : null
    }
    if (body.expiryDate !== undefined) {
      updates.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null
    }
    if (body.monitorId !== undefined) {
      updates.monitorId = body.monitorId || null
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes
    }

    const updated = await CostLineItemModel.findByIdAndUpdate(id, updates, { new: true }).lean()
    if (!updated) {
      return NextResponse.json({ error: "Cost line item not found" }, { status: 404 })
    }

    return NextResponse.json({
      _id: updated._id.toString(),
      projectId: (updated as any).projectId.toString(),
      organizationId: access.org._id,
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
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    const { projectId, id } = await params
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
    const canManageCosts =
      access.orgRole === UserRole.OWNER ||
      access.orgRole === UserRole.ADMIN ||
      ownerId === access.user._id
    if (!canManageCosts) {
      return NextResponse.json(
        { error: "Forbidden: owner/admin/project owner required" },
        { status: 403 }
      )
    }

    const result = await CostLineItemModel.findOneAndDelete({
      _id: id,
      projectId,
      organizationId: access.org._id
    })
    if (!result) {
      return NextResponse.json({ error: "Cost line item not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Delete project cost error:", error)
    return NextResponse.json({ error: error.message || "Failed to delete cost" }, { status: 500 })
  }
}
