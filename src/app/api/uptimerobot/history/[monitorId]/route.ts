import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UptimeHistoryModel } from "@/models/uptime-history.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/uptimerobot/history/[monitorId]
 * Returns up to `limit` uptime snapshots for a specific monitor, oldest-first.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ monitorId: string }> }
) {
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

    const { monitorId } = await params
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "48"), 200)

    const snapshots = await UptimeHistoryModel.find({
      organizationId: new mongoose.Types.ObjectId(String(organizationId)),
      monitorId
    })
      .sort({ checkedAt: -1 })
      .limit(limit)
      .select("status checkedAt -_id")
      .lean()

    // Return oldest-first for bar rendering
    return NextResponse.json((snapshots as any[]).reverse())
  } catch (error: any) {
    console.error("UR history error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
