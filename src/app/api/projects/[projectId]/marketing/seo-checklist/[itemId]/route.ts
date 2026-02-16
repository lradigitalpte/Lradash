import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import SEOChecklistItem from "@/models/seo-checklist.model"

// GET: Fetch a single checklist item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
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

    const { projectId, itemId } = await params
    await connectToDatabase()

    const item = await SEOChecklistItem.findOne({
      _id: itemId,
      projectId,
      organizationId: organizationId
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error fetching SEO checklist item:", error)
    return NextResponse.json({ error: "Failed to fetch checklist item" }, { status: 500 })
  }
}

// PATCH: Update a checklist item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
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

    const { projectId, itemId } = await params
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

    const updateData: any = {}

    if (body.title !== undefined) {
      updateData.title = body.title
    }
    if (body.description !== undefined) {
      updateData.description = body.description
    }
    if (body.category !== undefined) {
      updateData.category = body.category
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes
    }
    if (body.order !== undefined) {
      updateData.order = body.order
    }

    // Handle completion toggle
    if (body.completed !== undefined) {
      updateData.completed = body.completed
      if (body.completed) {
        updateData.completedAt = new Date()
        updateData.completedBy = decoded.userId
      } else {
        updateData.completedAt = null
        updateData.completedBy = null
      }
    }

    const item = await SEOChecklistItem.findOneAndUpdate(
      {
        _id: itemId,
        projectId,
        organizationId: organizationId
      },
      updateData,
      { new: true }
    )

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error("Error updating SEO checklist item:", error)
    return NextResponse.json({ error: "Failed to update checklist item" }, { status: 500 })
  }
}

// DELETE: Delete a checklist item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; itemId: string }> }
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

    const { projectId, itemId } = await params
    await connectToDatabase()

    // Verify project access
    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: organizationId
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const item = await SEOChecklistItem.findOneAndDelete({
      _id: itemId,
      projectId,
      organizationId: organizationId
    })

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Item deleted successfully" })
  } catch (error) {
    console.error("Error deleting SEO checklist item:", error)
    return NextResponse.json({ error: "Failed to delete checklist item" }, { status: 500 })
  }
}
