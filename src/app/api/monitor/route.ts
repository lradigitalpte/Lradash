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

export async function GET(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const monitors = await MonitorModel.find({ userId: decoded.userId }).sort({ createdAt: -1 })

    return NextResponse.json(monitors)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    await connectToDatabase()

    const monitor = await MonitorModel.create({
      ...body,
      userId: decoded.userId,
      nextCheck: new Date() // Trigger check immediately
    })

    return NextResponse.json(monitor, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
