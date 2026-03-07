import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { deleteFromS3, keyFromUrl } from "@/lib/aws/s3"
import { connectToDatabase } from "@/lib/db/connect"
import { BoardModel } from "@/models/board.model"
import { DocumentModel } from "@/models/document.model"

function canAccessBoard(board: any, userId: string) {
  const ownerId = board?.owner?.toString?.()
  const memberIds = ((board?.members || []) as any[]).map((m: any) => m?.toString?.() ?? m)
  return ownerId === userId || memberIds.includes(userId)
}

/** DELETE: remove a board document. Board owner or members only. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; id: string }> }
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

    const { boardId, id } = await params
    await connectToDatabase()

    const board = await BoardModel.findOne({ _id: boardId, deletedAt: null }).lean()
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 })
    }

    const userId = decoded.userId.toString()
    if (!canAccessBoard(board, userId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const document = await DocumentModel.findOne({ _id: id, board: boardId })
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    await DocumentModel.deleteOne({ _id: id })

    if (document.url) {
      const key = keyFromUrl(document.url)
      if (key) {
        await deleteFromS3(key).catch((err: any) => {
          console.warn("S3 delete warning:", err?.message)
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Board document DELETE error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to delete document" },
      { status: 500 }
    )
  }
}
