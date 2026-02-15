import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UserModel } from "@/models/user.model"
import { WorkPackageModel } from "@/models/workpackage.model"

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get("boardId")
    const projectId = searchParams.get("projectId")

    await connectToDatabase()

    const query: any = {
      organizationId: decoded.organizationId,
      deletedAt: null
    }

    if (boardId) {
      query.boardId = boardId
    }

    if (projectId) {
      query.projectId = projectId
    }

    const workPackages = await WorkPackageModel.find(query)
      .populate("owner", "name email avatar")
      .populate("assignees", "name email avatar")
      .populate("tasks")
      .lean()

    return NextResponse.json(
      { workPackages },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get work packages error:", error)
    return NextResponse.json(
      { error: "Failed to get work packages" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, description, status, dueDate, boardId, projectId, priority } = body

    // Validate input
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required and must be a string" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    const newWorkPackage = new WorkPackageModel({
      title,
      description: description || "",
      status: status || "TODO",
      dueDate: dueDate ? new Date(dueDate) : null,
      organizationId: decoded.organizationId,
      boardId: boardId || null,
      projectId: projectId || null,
      owner: decoded.userId,
      priority: priority || "MEDIUM",
      progress: 0
    })

    await newWorkPackage.save()

    // Populate owner info
    await newWorkPackage.populate("owner", "name email avatar")

    return NextResponse.json(
      {
        workPackage: {
          _id: newWorkPackage._id.toString(),
          title: newWorkPackage.title,
          description: newWorkPackage.description,
          status: newWorkPackage.status,
          dueDate: newWorkPackage.dueDate,
          priority: newWorkPackage.priority,
          progress: newWorkPackage.progress,
          owner: newWorkPackage.owner,
          assignees: [],
          tasks: [],
          createdAt: newWorkPackage.createdAt,
          updatedAt: newWorkPackage.updatedAt
        }
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create work package error:", error)
    return NextResponse.json(
      { error: "Failed to create work package" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
