import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getTasksByProjectId } from "@/lib/db/task"
import { ProjectModel } from "@/models/project.model"

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

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: organizationId,
      deletedAt: null
    })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .lean()

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Fetch tasks for the project
    const tasks = await getTasksByProjectId(projectId)

    return NextResponse.json(
      {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        owner: project.owner,
        organizationId: project.organizationId.toString(),
        isArchived: project.isArchived,
        members: project.members,
        tasks: tasks,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
