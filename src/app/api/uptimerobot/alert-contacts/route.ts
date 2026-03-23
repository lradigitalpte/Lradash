import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import { cacheGet, cacheSet } from "@/lib/uptimerobot/cache"
import { getUptimeRobotTokenForOrg } from "@/lib/uptimerobot/config"
import { urRequest } from "@/lib/uptimerobot/ur-client"
import { UserModel } from "@/models/user.model"

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
      return NextResponse.json({ contacts: [] }, { status: 200 })
    }

    let organizationId = decoded.organizationId
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
      organizationId = user?.defaultOrganizationId?.toString()
    }
    if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const cacheKey = `ur:${organizationId}:alertContacts`
    const cached = cacheGet<any>(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const apiToken = await getUptimeRobotTokenForOrg(organizationId)
    if (!apiToken) {
      return NextResponse.json({ error: "UptimeRobot not configured" }, { status: 400 })
    }

    const pathsToTry = ["/users/alertContacts", "/alertContacts"]

    let lastErr: any = null
    for (const path of pathsToTry) {
      try {
        const data = await urRequest<any>(apiToken, { path, method: "GET" })
        cacheSet(cacheKey, data, 30 * 60 * 1000) // 30 minutes
        return NextResponse.json(data)
      } catch (err: any) {
        lastErr = err
        const m = String(err?.message || "").match(/\((\d+)\)/)
        const status = m ? Number(m[1]) : null
        if (status === 404) {
          continue
        }
        throw err
      }
    }

    // If all attempts fail, return the last error
    throw lastErr
  } catch (error: any) {
    console.error("UR alert contacts proxy error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
