import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import { cacheGet, cacheSet } from "@/lib/uptimerobot/cache"
import { getUptimeRobotTokenForOrg } from "@/lib/uptimerobot/config"
import { urRequest } from "@/lib/uptimerobot/ur-client"
import { UserModel } from "@/models/user.model"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    if (!orgMemberIds?.length) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let organizationId = decoded.organizationId
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      organizationId = user?.defaultOrganizationId?.toString()
    }
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const monitorId = (await params).id
    if (!monitorId) {
      return NextResponse.json({ error: "monitorId required" }, { status: 400 })
    }

    const cacheKey = `ur:${organizationId}:uptime:${monitorId}`
    const cached = cacheGet<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    // UptimeRobot v3: GET /monitors/{id}/stats/uptime
    const data = await urRequest<any>(apiToken, {
      path: `/monitors/${monitorId}/stats/uptime`,
      method: "GET"
    })

    cacheSet(cacheKey, data, 2 * 60 * 1000) // 2 minutes
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("UR uptime stats proxy error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
