import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { WorkPackageModel } from "@/models/workpackage.model"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const workPackage = await WorkPackageModel.findOne({
      _id: id,
      organizationId: decoded.organizationId,
      deletedAt: null
    })
      .populate("owner", "name email avatar")
      .populate("assignees", "name email avatar")
      .populate("tasks")
      .lean()

    if (!workPackage) {
      return NextResponse.json(
        { error: "Work package not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      { workPackage },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get work package error:", error)
    return NextResponse.json(
      { error: "Failed to get work package" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()

    await connectToDatabase()

    const workPackage = await WorkPackageModel.findOne({
      _id: id,
      deletedAt: null
    })

    if (!workPackage) {
      return NextResponse.json(
        { error: "Work package not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Handle owner change
    if (body.ownerId !== undefined) {
      workPackage.owner = body.ownerId
    }

    await workPackage.save()

    // Populate for response
    await workPackage.populate("owner", "name email avatar")
    await workPackage.populate("assignees", "name email avatar")

    return NextResponse.json(
      { workPackage },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Update work package error:", error)
    return NextResponse.json(
      { error: "Failed to update work package" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { title, description, status, dueDate, priority, progress, assignees } = body

    await connectToDatabase()

    const workPackage = await WorkPackageModel.findOne({
      _id: id,
      organizationId: decoded.organizationId,
      deletedAt: null
    })

    if (!workPackage) {
      return NextResponse.json(
        { error: "Work package not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Update fields
    if (title !== undefined) {
      workPackage.title = title
    }
    if (description !== undefined) {
      workPackage.description = description
    }
    if (status !== undefined) {
      workPackage.status = status
    }
    if (dueDate !== undefined) {
      workPackage.dueDate = dueDate ? new Date(dueDate) : undefined
    }
    if (priority !== undefined) {
      workPackage.priority = priority
    }
    if (progress !== undefined) {
      workPackage.progress = progress
    }
    if (assignees !== undefined) {
      workPackage.assignees = assignees
    }

    await workPackage.save()

    // Populate for response
    await workPackage.populate("owner", "name email avatar")
    await workPackage.populate("assignees", "name email avatar")

    return NextResponse.json(
      { workPackage },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Update work package error:", error)
    return NextResponse.json(
      { error: "Failed to update work package" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const workPackage = await WorkPackageModel.findOne({
      _id: id,
      organizationId: decoded.organizationId,
      deletedAt: null
    })

    if (!workPackage) {
      return NextResponse.json(
        { error: "Work package not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Soft delete
    workPackage.deletedAt = new Date()
    await workPackage.save()

    return NextResponse.json(
      { message: "Work package deleted successfully" },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Delete work package error:", error)
    return NextResponse.json(
      { error: "Failed to delete work package" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
