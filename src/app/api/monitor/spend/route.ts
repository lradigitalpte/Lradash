import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrgMemberIds } from "@/lib/org-members"
import CostLineItemModel from "@/models/cost-line-item.model"
import MonitorModel from "@/models/monitor.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"
import { CostFrequency } from "@/types/cost-line-item"

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {return null}
  const decoded = verifyAccessToken(authHeader.substring(7))
  return decoded
}

async function getOrganizationId(decoded: {
  userId: string
  organizationId?: string
}): Promise<string | null> {
  if (decoded.organizationId) {return decoded.organizationId}
  const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
  return user?.defaultOrganizationId?.toString() ?? null
}

function costLineItemMonthly(amount: number, frequency: string): number {
  switch (frequency) {
    case CostFrequency.ONE_TIME:
      return amount / 12
    case CostFrequency.WEEKLY:
      return amount * (52 / 12)
    case CostFrequency.MONTHLY:
      return amount
    case CostFrequency.ANNUAL:
      return amount / 12
    default:
      return amount
  }
}

function monitorMonthly(monitor: { price?: number; metadata?: { billingCycle?: string } }): number {
  const price = monitor.price ?? 0
  const cycle = monitor.metadata?.billingCycle || "MONTHLY"
  if (cycle === "ANNUAL") {return price / 12}
  if (cycle === "QUARTERLY") {return price / 3}
  return price
}

export async function GET(request: NextRequest) {
  try {
    const decoded = await getAuthenticatedUser(request)
    if (!decoded) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const organizationId = await getOrganizationId(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const [projects, costItems, orgMemberIds] = await Promise.all([
      ProjectModel.find({ organizationId, deletedAt: null }).select("title").lean(),
      CostLineItemModel.find({ organizationId }).lean(),
      getOrgMemberIds(decoded.userId)
    ])

    const monitors =
      orgMemberIds?.length && (await MonitorModel.find({ userId: { $in: orgMemberIds } }).lean())

    const monitorsList = (monitors || []) as any[]

    const projectMap = new Map<string, { title: string }>()
    for (const p of projects as any[]) {
      projectMap.set(p._id.toString(), { title: p.title })
    }

    const costByProject = new Map<string, { items: any[]; totalMonthly: number }>()
    for (const p of projects as any[]) {
      costByProject.set(p._id.toString(), { items: [], totalMonthly: 0 })
    }

    for (const item of costItems as any[]) {
      const pid = item.projectId?.toString()
      if (!pid) {continue}
      if (!costByProject.has(pid)) {
        costByProject.set(pid, { items: [], totalMonthly: 0 })
      }
      const entry = costByProject.get(pid)!
      entry.items.push(item)
      entry.totalMonthly += costLineItemMonthly(item.amount, item.frequency)
    }

    const monitorsByProject = new Map<string, any[]>()
    let unlinkedMonitorsTotal = 0
    for (const m of monitorsList) {
      const pid = m.projectId?.toString?.() ?? m.projectId ?? null
      const monthly = monitorMonthly(m)
      if (pid) {
        if (!monitorsByProject.has(pid)) {monitorsByProject.set(pid, [])}
        monitorsByProject.get(pid)!.push(m)
        const entry = costByProject.get(pid)
        if (entry) {entry.totalMonthly += monthly}
      } else {
        unlinkedMonitorsTotal += monthly
      }
    }

    let grandTotal = unlinkedMonitorsTotal
    const projectSummaries = []
    for (const [projectId, entry] of costByProject.entries()) {
      grandTotal += entry.totalMonthly
      const proj = projectMap.get(projectId)
      const linkedMons = monitorsByProject.get(projectId) || []
      projectSummaries.push({
        projectId,
        title: proj?.title ?? "Unknown",
        totalMonthly: Math.round(entry.totalMonthly * 100) / 100,
        costLineItemCount: entry.items.length,
        linkedMonitorCount: linkedMons.length,
        costLineItems: entry.items.map((i: any) => ({
          _id: i._id.toString(),
          name: i.name,
          type: i.type,
          amount: i.amount,
          currency: i.currency,
          frequency: i.frequency
        })),
        linkedMonitors: linkedMons.map((m: any) => ({
          _id: m._id.toString(),
          name: m.name,
          type: m.type,
          price: m.price,
          currency: m.currency,
          status: m.status
        }))
      })
    }

    return NextResponse.json({
      grandTotalMonthly: Math.round(grandTotal * 100) / 100,
      projects: projectSummaries,
      subscriptionCount: monitorsList.filter((m: any) => m.type === "SUBSCRIPTION").length
    })
  } catch (error: any) {
    console.error("Spend summary error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to load spend summary" },
      { status: 500 }
    )
  }
}
