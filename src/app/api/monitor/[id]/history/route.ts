import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import MonitorCheckResultModel from "@/models/monitor-check-result.model"
import MonitorModel from "@/models/monitor.model"

const HISTORY_HOURS = 24

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {return null}
  return verifyAccessToken(authHeader.substring(7))
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: monitorId } = await params
    if (!monitorId || !mongoose.Types.ObjectId.isValid(monitorId)) {
      return NextResponse.json({ error: "Invalid monitor id" }, { status: 400 })
    }

    await connectToDatabase()

    const monitor = await MonitorModel.findById(monitorId).lean()
    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    const monitorUserId = (monitor as any).userId?.toString?.() ?? (monitor as any).userId
    if (!orgMemberIds?.length || !monitorUserId || !orgMemberIds.includes(monitorUserId)) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const since = new Date(Date.now() - HISTORY_HOURS * 60 * 60 * 1000)
    const results = await MonitorCheckResultModel.find({
      monitorId,
      timestamp: { $gte: since }
    })
      .sort({ timestamp: 1 })
      .lean()

    const list = (results as any[]).map((r) => ({
      timestamp: r.timestamp,
      status: r.status,
      responseTime: r.responseTime
    }))

    return NextResponse.json(list)
  } catch (error: any) {
    console.error("Monitor history error:", error)
    return NextResponse.json({ error: error.message || "Failed to load history" }, { status: 500 })
  }
}
