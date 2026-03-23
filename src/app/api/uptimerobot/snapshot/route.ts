import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { cacheGet, cacheSet } from "@/lib/uptimerobot/cache"
import { getUptimeRobotTokenForOrg } from "@/lib/uptimerobot/config"
import { urRequest } from "@/lib/uptimerobot/ur-client"
import { UptimeHistoryModel } from "@/models/uptime-history.model"
import { UserModel } from "@/models/user.model"

function resolveStatus(raw: string | undefined | null): "UP" | "DOWN" | "WARNING" {
  const v = String(raw ?? "").toUpperCase()
  if (v.includes("DOWN") || v === "0") {
    return "DOWN"
  }
  if (v.includes("WARN") || v === "2") {
    return "WARNING"
  }
  return "UP"
}

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

    let organizationId = decoded.organizationId
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      organizationId = (user as any)?.defaultOrganizationId?.toString()
    }
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    // Rate-limit: once per 3 minutes per org to avoid hammering the DB
    const cooldownKey = `ur:${organizationId}:snapshot_cooldown`
    if (cacheGet(cooldownKey)) {
      return NextResponse.json({ skipped: true, reason: "cooldown" })
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    // Use cached monitors if available (avoids extra UR API call)
    let monitors: any[] = []
    const cachedMonitors = cacheGet<any>(`ur:${organizationId}:monitors`)
    if (cachedMonitors) {
      monitors = Array.isArray(cachedMonitors?.data)
        ? cachedMonitors.data
        : Array.isArray(cachedMonitors)
          ? cachedMonitors
          : []
    } else {
      const data = await urRequest<any>(apiToken, { path: "/monitors", method: "GET" })
      cacheSet(`ur:${organizationId}:monitors`, data, 5 * 60 * 1000)
      monitors = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    }

    if (!monitors.length) {
      return NextResponse.json({ saved: 0 })
    }

    const now = new Date()
    const orgOid = new mongoose.Types.ObjectId(String(organizationId))

    const docs = monitors
      .map((m: any) => ({
        organizationId: orgOid,
        monitorId: String(m.id ?? m.monitorId ?? ""),
        monitorName: String(m.friendlyName ?? m.name ?? ""),
        status: resolveStatus(m.status),
        checkedAt: now
      }))
      .filter((d) => d.monitorId)

    await UptimeHistoryModel.insertMany(docs, { ordered: false })

    // Set cooldown (3 minutes)
    cacheSet(cooldownKey, true, 3 * 60 * 1000)

    return NextResponse.json({ saved: docs.length })
  } catch (error: any) {
    console.error("UR snapshot error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
