import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"

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

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const { projectId } = await params
    const body = await request.json()

    // TODO: Create task in database when task model is ready
    // For now, return a mock response
    return NextResponse.json(
      {
        _id: "temp-task-" + Date.now(),
        ...body,
        projectId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        status: 201,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
