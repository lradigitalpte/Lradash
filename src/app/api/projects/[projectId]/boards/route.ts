import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { canManageBoard, toIdString } from "@/lib/board-access"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      organizationId = (user as any)?.defaultOrganizationId?.toString()
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const userId =
      typeof decoded.userId === "string" && mongoose.Types.ObjectId.isValid(decoded.userId)
        ? new mongoose.Types.ObjectId(decoded.userId)
        : decoded.userId

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId,
      deletedAt: null,
      $or: [{ owner: userId }, { members: userId }]
    } as any)
      .select("owner members")
      .lean()

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const boards = await BoardModel.find({
      projectId: projectId,
      organizationId,
      deletedAt: null
    })
      .populate("owner", "name email")
      .lean()

    const uid = decoded.userId.toString()
    const boardsPayload = await Promise.all(
      boards.map(async (b) => ({
        id: b._id.toString(),
        title: b.title,
        description: b.description,
        projectId: b.projectId?.toString(),
        owner: b.owner,
        canManage: await canManageBoard(b, uid),
        isArchived: b.isArchived,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt
      }))
    )

    return NextResponse.json(boardsPayload, {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get boards error:", error)
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      organizationId = (user as any)?.defaultOrganizationId?.toString()
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const userId =
      typeof decoded.userId === "string" && mongoose.Types.ObjectId.isValid(decoded.userId)
        ? new mongoose.Types.ObjectId(decoded.userId)
        : decoded.userId

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId,
      deletedAt: null,
      $or: [{ owner: userId }, { members: userId }]
    } as any)
      .select("owner members")
      .lean()

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const memberIds = Array.from(
      new Set(
        [decoded.userId, (project as any).owner, ...((project as any).members || [])]
          .map((member) => toIdString(member))
          .filter((member): member is string => !!member)
      )
    )

    const board = await BoardModel.create({
      title,
      description: description || "",
      projectId: projectId,
      organizationId,
      owner: decoded.userId,
      members: memberIds,
      isPrivate: false
    } as any)

    return NextResponse.json(
      {
        id: board._id.toString(),
        title: board.title,
        description: board.description,
        projectId: board.projectId?.toString(),
        owner: decoded.userId,
        canManage: true
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create board error:", error)
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
