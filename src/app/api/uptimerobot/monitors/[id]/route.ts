import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { cacheSet } from "@/lib/uptimerobot/cache"
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
  cacheSet(`ur:${organizationId}:monitors`, null, 0)
}

/**
 * PUT /api/uptimerobot/monitors/[id]
 * Update an existing UptimeRobot monitor.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Monitor ID required" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { friendlyName, url, interval, alertContacts, host, port } = body

    // UR v3 may require `timeout` on updates as well (0..60 seconds).
    const payload: Record<string, any> = { timeout: 30 }
    if (friendlyName?.trim()) {
      payload.friendlyName = friendlyName.trim()
    }
    if (url?.trim()) {
      payload.url = url.trim()
    }
    if (interval) {
      payload.interval = Number(interval)
    }
    // PORT monitors: UR v3 uses `url` for host/IP (not a separate `host` field)
    if (host?.trim()) {
      payload.url = host.trim()
    }
    if (port) {
      payload.port = Number(port)
    }
    if (alertContacts) {
      payload.alertContacts = alertContacts
    }

    if (!Object.keys(payload).length) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    const data = await urRequest<any>(apiToken, {
      path: `/monitors/${id}`,
      method: "PUT",
      body: payload
    })

    invalidateMonitorsCache(organizationId)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("UR monitor PUT error:", error)
    const msg: string = error.message || "Server error"
    const status = msg.includes("(400)") ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

/**
 * DELETE /api/uptimerobot/monitors/[id]
 * Delete a UptimeRobot monitor.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const organizationId = await resolveOrgId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "Monitor ID required" }, { status: 400 })
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    const data = await urRequest<any>(apiToken, {
      path: `/monitors/${id}`,
      method: "DELETE"
    })

    invalidateMonitorsCache(organizationId)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("UR monitor DELETE error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
