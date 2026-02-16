import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import SEOChecklistItem from "@/models/seo-checklist.model"

// GET: Fetch all checklist items for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const { projectId } = await params
    await connectToDatabase()

    // Verify project access
    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: organizationId
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const items = await SEOChecklistItem.find({
      projectId,
      organizationId: organizationId
    }).sort({ category: 1, order: 1, createdAt: 1 })

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Error fetching SEO checklist:", error)
    return NextResponse.json({ error: "Failed to fetch checklist items" }, { status: 500 })
  }
}

// POST: Create a new checklist item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const { UserModel } = await import("@/models/user.model")
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const { projectId } = await params
    const body = await request.json()
    await connectToDatabase()

    // Verify project access
    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: organizationId
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get the highest order number in this category
    const maxOrderItem = await SEOChecklistItem.findOne({
      projectId,
      category: body.category
    }).sort({ order: -1 })

    const newItem = await SEOChecklistItem.create({
      projectId,
      organizationId: organizationId,
      title: body.title,
      description: body.description,
      category: body.category,
      notes: body.notes,
      completed: false,
      order: maxOrderItem?.order ? maxOrderItem.order + 1 : 0
    })

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (error) {
    console.error("Error creating SEO checklist item:", error)
    return NextResponse.json({ error: "Failed to create checklist item" }, { status: 500 })
  }
}
