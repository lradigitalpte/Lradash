import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { cacheGet, cacheSet } from "@/lib/uptimerobot/cache"
import { getUptimeRobotConfigForOrg } from "@/lib/uptimerobot/config"
import { UserModel } from "@/models/user.model"

/**
 * Extracts the PSP ID from a UptimeRobot status page URL.
 * e.g. "https://stats.uptimerobot.com/TB0K803WdS" → "TB0K803WdS"
 */
function extractPspId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    const parts = parsed.pathname.split("/").filter(Boolean)
    return parts[0] ?? null
  } catch {
    const clean = url.trim().replace(/^\//, "")
    if (clean.length > 4 && !clean.includes("/") && !clean.includes(".")) {
      return clean
    }
    return null
  }
}

/**
 * GET /api/uptimerobot/psp
 *
 * Fetches the UptimeRobot Public Status Page API for the org's configured PSP.
 * Returns per-monitor dailyRatios (90 days), 30d/90d ratios, last downtime.
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

    // Get the stored status page URL via native driver (bypasses Mongoose strict mode cache)
    const { statusPageUrl } = await getUptimeRobotConfigForOrg(String(organizationId))

    if (!statusPageUrl) {
      return NextResponse.json(
        { error: "No status page URL configured. Add it in UptimeRobot Config settings." },
        { status: 400 }
      )
    }

    const pspId = extractPspId(statusPageUrl)
    if (!pspId) {
      return NextResponse.json(
        { error: "Could not extract PSP ID from status page URL" },
        { status: 400 }
      )
    }

    // Check cache
    const cacheKey = `ur:${organizationId}:psp:${pspId}`
    const cached = cacheGet<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Fetch from UptimeRobot Public Status Page API (no auth required)
    const apiUrl = `https://stats.uptimerobot.com/api/getMonitorList/${pspId}`
    const res = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Dashboard/1.0)",
        Accept: "application/json"
      },
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      return NextResponse.json({ error: `PSP API returned ${res.status}` }, { status: 502 })
    }

    const data = await res.json()

    // Cache for 5 minutes
    cacheSet(cacheKey, data, 5 * 60 * 1000)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("UR PSP proxy error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
