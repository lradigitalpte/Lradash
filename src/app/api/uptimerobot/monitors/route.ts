import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import { cacheGet, cacheSet } from "@/lib/uptimerobot/cache"
import { getUptimeRobotTokenForOrg } from "@/lib/uptimerobot/config"
import { urRequest } from "@/lib/uptimerobot/ur-client"
import { UserModel } from "@/models/user.model"

async function resolveOrgId(decoded: any): Promise<string | null> {
  let organizationId = decoded.organizationId
  if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
    organizationId = (user as any)?.defaultOrganizationId?.toString()
  }
  if (!organizationId || !mongoose.Types.ObjectId.isValid(organizationId)) {
    return null
  }
  return String(organizationId)
}

function invalidateMonitorsCache(organizationId: string) {
  // Set an expired entry to bust the cache
  cacheSet(`ur:${organizationId}:monitors`, null, 0)
}

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
    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    if (!orgMemberIds?.length) {
      return NextResponse.json([], { status: 200 })
    }

    const organizationId = await resolveOrgId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const cached = cacheGet<any>(`ur:${organizationId}:monitors`)
    if (cached) {
      return NextResponse.json(cached)
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    const data = await urRequest<any>(apiToken, { path: "/monitors", method: "GET" })

    cacheSet(`ur:${organizationId}:monitors`, data, 5 * 60 * 1000)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("UR monitors GET error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}

/**
 * POST /api/uptimerobot/monitors
 * Create a new UptimeRobot monitor.
 * Body: { friendlyName, url, type, interval, alertContacts?, port?, host? }
 */
export async function POST(request: NextRequest) {
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

    const organizationId = await resolveOrgId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { friendlyName, url, type = "HTTP", interval = 300, alertContacts, host, port } = body

    if (!friendlyName?.trim()) {
      return NextResponse.json({ error: "friendlyName is required" }, { status: 400 })
    }

    const isHTTP = String(type).toUpperCase() === "HTTP" || String(type).toUpperCase() === "HTTPS"
    const isPORT = String(type).toUpperCase() === "PORT"

    if (isHTTP && !url?.trim()) {
      return NextResponse.json({ error: "url is required for HTTP monitors" }, { status: 400 })
    }
    if (isPORT && (!host?.trim() || !port)) {
      return NextResponse.json(
        { error: "host and port are required for PORT monitors" },
        { status: 400 }
      )
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    // UR v3 requires `timeout` (0–60 seconds) on all monitor types
    const payload: Record<string, any> = {
      friendlyName: friendlyName.trim(),
      type: String(type).toUpperCase(),
      interval: Number(interval) || 300,
      timeout: 30
    }

    if (isHTTP) {
      payload.url = url.trim()
    }
    if (isPORT) {
      // UR v3 PORT monitors use `url` for host/IP (not a separate `host` field)
      payload.url = host.trim()
      payload.port = Number(port)
    }
    if (alertContacts?.length) {
      payload.alertContacts = alertContacts
    }

    const data = await urRequest<any>(apiToken, {
      path: "/monitors",
      method: "POST",
      body: payload
    })

    invalidateMonitorsCache(organizationId)

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("UR monitors POST error:", error)
    // Surface UR 400 validation errors as 400 so the UI toast shows the real reason
    const msg: string = error.message || "Server error"
    const status = msg.includes("(400)") ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
