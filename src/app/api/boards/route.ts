import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { fetchBoardsFromDb, createBoardInDb } from "@/lib/db/board"

export async function GET(request: NextRequest) {
  try {
    // Verify Bearer token
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Use email directly from token (same pattern as tasks API)
    const boards = await fetchBoardsFromDb(decoded.email)

    return NextResponse.json({ success: true, boards })
  } catch (error) {
    console.error("Error fetching boards:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify Bearer token
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Use email directly from token (same pattern as tasks API)
    const board = await createBoardInDb({
      title,
      userEmail: decoded.email,
      description
    })

    if (!board) {
      return NextResponse.json({ error: "Failed to create board" }, { status: 500 })
    }

    return NextResponse.json({ success: true, boardId: board._id })
  } catch (error) {
    console.error("Error creating board:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
