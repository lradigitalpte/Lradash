import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { DocumentModel } from "@/models/document.model"

function canAccessBoard(board: any, userId: string) {
  const ownerId = board?.owner?.toString?.()
  const memberIds = ((board?.members || []) as any[]).map((m: any) => m?.toString?.() ?? m)
  return ownerId === userId || memberIds.includes(userId)
}

/** GET: list documents for this board. Board owner or members only. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId } = await params
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const userId = decoded.userId.toString()
    if (!canAccessBoard(board, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const documents = await DocumentModel.find({ board: boardId })
      .populate("uploader", "name email avatar")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error("Board documents GET error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to fetch documents" },
      { status: 500 }
    )
  }
}

/** POST: create a document for this board (after S3 upload). Board owner or members only. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyAccessToken(authHeader.substring(7))
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { boardId } = await params
    const body = await request.json()
    const { name, type, size, url } = body

    if (!name || !type || !size) {
      return NextResponse.json({ error: "Name, type, and size are required" }, { status: 400 })
    }

    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const userId = decoded.userId.toString()
    if (!canAccessBoard(board, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const orgId = (board as any).organizationId
    if (!orgId) {
      return NextResponse.json({ error: "Board has no organization" }, { status: 400 })
    }

    const doc = await DocumentModel.create({
      name,
      type,
      size,
      folder: "General",
      url: url || "",
      project: null,
      board: boardId,
      uploader: decoded.userId,
      organizationId: orgId
    })

    const populated = await DocumentModel.findById(doc._id)
      .populate("uploader", "name email avatar")
      .lean()

    return NextResponse.json(populated, { status: 201 })
  } catch (error: any) {
    console.error("Board documents POST error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create document" },
      { status: 500 }
    )
  }
}
