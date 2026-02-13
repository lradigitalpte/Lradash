import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
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

    if (!decoded || !decoded.organizationId) {
      return NextResponse.json(
        { error: "Invalid token or missing organization" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { projectId } = await params
    await connectToDatabase()

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId: decoded.organizationId,
      deletedAt: null
    })
      .populate("owner", "name email")
      .lean()

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        _id: project._id.toString(),
        title: project.title,
        description: project.description,
        owner: project.owner,
        organizationId: project.organizationId.toString(),
        isArchived: project.isArchived,
        tasks: [], // TODO: Fetch tasks from database when task model is ready
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
