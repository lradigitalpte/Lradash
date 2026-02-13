import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ listId: string }> }
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

    const { listId } = await params
    const body = await request.json()

    // TODO: Create card in database when models are ready
    // For now, return mock response
    return NextResponse.json(
      {
        _id: "card-" + Date.now(),
        title: body.title,
        description: body.description || "",
        listId,
        position: 999,
        labels: [],
        members: [],
        checklist: [],
        attachments: [],
        createdAt: new Date().toISOString()
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create card error:", error)
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
