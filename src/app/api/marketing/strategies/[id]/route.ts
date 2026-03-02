import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { MarketingStrategyModel } from "@/models/marketing-strategy.model"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const { id } = await params
    const body = await request.json()
    const { title, description, status, targets } = body

    const strategy = await MarketingStrategyModel.findByIdAndUpdate(
      id,
      {
        title,
        description,
        status,
        targets
      },
      { new: true }
    )

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json(strategy)
  } catch (error) {
    console.error("Update strategy error:", error)
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    const { id } = await params

    const strategy = await MarketingStrategyModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    )

    if (!strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json(strategy)
  } catch (error) {
    console.error("Delete strategy error:", error)
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 })
  }
}
