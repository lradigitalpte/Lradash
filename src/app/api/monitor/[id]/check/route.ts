import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getSSLExpiry } from "@/lib/monitor/checker"
import { getOrgMemberIds } from "@/lib/org-members"
import MonitorModel from "@/models/monitor.model"
import { MonitorStatus } from "@/types/monitor"

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  return verifyAccessToken(authHeader.substring(7))
}

/** POST: run SSL check now and update monitor with expiry (so user sees expiry without waiting for cron). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const monitor = await MonitorModel.findById(id).lean()
    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const orgMemberIds = await getOrgMemberIds(decoded.userId)
    const monitorUserId = (monitor as any).userId?.toString?.() ?? (monitor as any).userId
    if (!orgMemberIds?.length || !monitorUserId || !orgMemberIds.includes(monitorUserId)) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const type = (monitor as any).type
    if (type !== "SSL") {
      return NextResponse.json(
        { error: "Check now is only supported for SSL monitors" },
        { status: 400 }
      )
    }

    const target = (monitor as any).target || ""
    const check = await getSSLExpiry(target)

    let status: string = MonitorStatus.PENDING
    let expiryDate: Date | undefined

    if (check.expiryDate) {
      expiryDate = check.expiryDate
      const now = new Date()
      const daysLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
      status =
        daysLeft < 0 ? MonitorStatus.DOWN : daysLeft < 7 ? MonitorStatus.WARNING : MonitorStatus.UP
    } else {
      status = MonitorStatus.DOWN
    }

    const updateData: Record<string, unknown> = {
      status,
      lastChecked: new Date(),
      nextCheck: new Date(Date.now() + (monitor as any).frequency * 60000)
    }
    if (expiryDate !== undefined) {
      updateData.expiryDate = expiryDate
    }

    const updated = await MonitorModel.findByIdAndUpdate(id, updateData, { new: true }).lean()
    const u = updated as any
    return NextResponse.json({
      ...u,
      _id: u._id.toString(),
      expiryDate: u.expiryDate,
      status: u.status
    })
  } catch (error: any) {
    console.error("Monitor check error:", error)
    return NextResponse.json({ error: error.message || "Check failed" }, { status: 500 })
  }
}
