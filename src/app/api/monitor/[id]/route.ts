import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import MonitorModel from "@/models/monitor.model"

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }
  const token = authHeader.substring(7)
  const decoded = verifyAccessToken(token)
  return decoded
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectToDatabase()

    const monitor = await MonitorModel.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      { ...body },
      { new: true }
    )

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    return NextResponse.json(monitor)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const result = await MonitorModel.findOneAndDelete({ _id: id, userId: decoded.userId })

    if (!result) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
