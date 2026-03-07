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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params
    await connectToDatabase()

    const organizationId = await getOrganizationId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId,
      deletedAt: null
    }).lean()

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const items = await CostLineItemModel.find({ projectId, organizationId })
      .sort({ createdAt: -1 })
      .lean()

    const list = items.map((item: any) => ({
      _id: item._id.toString(),
      projectId: item.projectId.toString(),
      organizationId: item.organizationId.toString(),
      type: item.type,
      name: item.name,
      amount: item.amount,
      currency: item.currency,
      frequency: item.frequency,
      dueDate: item.dueDate,
      expiryDate: item.expiryDate,
      monitorId: item.monitorId?.toString(),
      notes: item.notes,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))

    return NextResponse.json(list)
  } catch (error: any) {
    console.error("Get project costs error:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch costs" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
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

    const { projectId } = await params
    const body = await request.json()
    const {
      type,
      name,
      amount,
      currency = "USD",
      frequency,
      dueDate,
      expiryDate,
      monitorId,
      notes
    } = body

    if (!name || amount == null || !type || !frequency) {
      return NextResponse.json(
        { error: "name, amount, type, and frequency are required" },
        { status: 400 }
      )
    }
    if (!Object.values(CostLineItemType).includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    if (!Object.values(CostFrequency).includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
    }

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

    const item = await CostLineItemModel.create({
      projectId,
      organizationId,
      type,
      name,
      amount: Number(amount),
      currency: currency || "USD",
      frequency,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      monitorId: monitorId || undefined,
      notes: notes || undefined
    })

    const created = await CostLineItemModel.findById(item._id).lean()
    return NextResponse.json(
      {
        _id: created!._id.toString(),
        projectId: created!.projectId.toString(),
        organizationId: (created as any).organizationId.toString(),
        type: (created as any).type,
        name: (created as any).name,
        amount: (created as any).amount,
        currency: (created as any).currency,
        frequency: (created as any).frequency,
        dueDate: (created as any).dueDate,
        expiryDate: (created as any).expiryDate,
        monitorId: (created as any).monitorId?.toString(),
        notes: (created as any).notes,
        createdAt: (created as any).createdAt,
        updatedAt: (created as any).updatedAt
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Create project cost error:", error)
    return NextResponse.json({ error: error.message || "Failed to create cost" }, { status: 500 })
  }
}
