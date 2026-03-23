import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UptimeHistoryModel } from "@/models/uptime-history.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/uptimerobot/history
 * Returns uptime history for all monitors in the org, grouped by monitorId.
 * Response: { byMonitorId: { [monitorId]: Array<{ status, checkedAt }> } }
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    let organizationId = decoded.organizationId
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      organizationId = (user as any)?.defaultOrganizationId?.toString()
    }
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const limitPerMonitor = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "48"),
      200
    )

    // Fetch ALL snapshots for this org, oldest-first so we can trim tail later
    const snapshots = await UptimeHistoryModel.find({
      organizationId: new mongoose.Types.ObjectId(String(organizationId))
    })
      .sort({ checkedAt: 1 })
      .select("monitorId status checkedAt -_id")
      .lean()

    // Group by monitorId
    const byMonitorId: Record<string, Array<{ status: string; checkedAt: string }>> = {}
    for (const s of snapshots as any[]) {
      const id = String(s.monitorId)
      if (!byMonitorId[id]) {
        byMonitorId[id] = []
      }
      byMonitorId[id].push({ status: s.status, checkedAt: s.checkedAt })
    }

    // Trim each monitor to the last N entries
    for (const id of Object.keys(byMonitorId)) {
      if (byMonitorId[id].length > limitPerMonitor) {
        byMonitorId[id] = byMonitorId[id].slice(-limitPerMonitor)
      }
    }

    return NextResponse.json({ byMonitorId })
  } catch (error: any) {
    console.error("UR history (bulk) error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
