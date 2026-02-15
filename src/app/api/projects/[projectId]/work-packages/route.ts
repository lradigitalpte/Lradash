import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { WorkPackageModel } from "@/models/workpackage.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
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
    const { projectId } = await params

    // Fetch work packages for this project
    const workPackages = await WorkPackageModel.find({
      projectId,
      deletedAt: null
    })
      .populate("owner", "name avatar email")
      .populate("assignees", "name avatar email")
      .sort({ createdAt: -1 })

    return NextResponse.json(workPackages, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get work packages error:", error)
    return NextResponse.json(
      { error: "Failed to fetch work packages" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
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

    await connectToDatabase()
    const { projectId } = await params
    const body = await request.json()

    // Create work package
    const workPackage = new WorkPackageModel({
      title: body.title,
      description: body.description,
      status: body.status || "TODO",
      priority: body.priority || "MEDIUM",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      projectId,
      organizationId: body.organizationId,
      owner: decoded.userId,
      assignees: body.assignees || []
    })

    await workPackage.save()

    // Populate related fields
    await workPackage.populate("owner", "name avatar email")

    return NextResponse.json(workPackage, {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Create work package error:", error)
    return NextResponse.json(
      { error: "Failed to create work package" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
