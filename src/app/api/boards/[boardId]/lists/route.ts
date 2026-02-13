import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
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

    const { boardId } = await params
    const body = await request.json()

    // TODO: Create list in database when models are ready
    // For now, return mock response
    return NextResponse.json(
      {
        _id: "list-" + Date.now(),
        title: body.title,
        boardId,
        position: 999,
        cards: [],
        createdAt: new Date().toISOString()
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create list error:", error)
    return NextResponse.json(
      { error: "Failed to create list" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
