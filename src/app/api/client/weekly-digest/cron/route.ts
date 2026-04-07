import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import {
  OrganizationAccessContext,
  requireOrganizationAccess
} from "@/lib/auth/organization-access"
import { extractTokenFromHeader, verifyAccessToken } from "@/lib/auth/tokens"
import { getClientOverviewData } from "@/lib/client/overview"
import { connectToDatabase } from "@/lib/db/connect"
import { getNotificationEmail } from "@/lib/email/get-notification-email"
import { sendClientWeeklyDigestEmail } from "@/lib/email/send-client-weekly-digest"
import { ClientDigestLogModel } from "@/models/client-digest-log.model"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

function getIsoWeekKey(date = new Date()): string {
  const working = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = working.getUTCDay() || 7
  working.setUTCDate(working.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(working.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((working.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${working.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")
  const cronSecret = process.env.CRON_SECRET
  const dryRun = searchParams.get("dryRun") === "1"
  const force = searchParams.get("force") === "1"

  const authHeader = request.headers.get("Authorization") || request.headers.get("authorization")
  const token = extractTokenFromHeader(authHeader)
  const isAuthenticated = token ? !!verifyAccessToken(token) : false
  const hasValidCronKey = !!cronSecret && key === cronSecret

  if (process.env.NODE_ENV === "production" && !hasValidCronKey && !isAuthenticated) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (process.env.NODE_ENV !== "production" && !hasValidCronKey && !isAuthenticated && cronSecret) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    await connectToDatabase()

    let scopedOrgId: string | null = null
    let scope: "cron" | "organization" = "cron"

    if (!hasValidCronKey) {
      const access = await requireOrganizationAccess(request)
      if ("error" in access) {
        return access.error
      }

      if (access.orgRole !== UserRole.OWNER && access.orgRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden: owner/admin role required" }, { status: 403 })
      }

      scopedOrgId = access.org._id
      scope = "organization"
    }

    const organizationFilter: any = {
      deletedAt: null,
      ...(scopedOrgId
        ? { _id: new mongoose.Types.ObjectId(scopedOrgId) }
        : { members: { $elemMatch: { role: UserRole.CLIENT } } })
    }

    const organizations = await OrganizationModel.find(organizationFilter)
      .select("_id name slug owner members")
      .lean()

    const weekKey = getIsoWeekKey()
    let organizationsScanned = 0
    let clientsScanned = 0
    let sent = 0
    let skipped = 0
    let failed = 0

    for (const org of organizations as any[]) {
      organizationsScanned += 1
      const clientMemberIds = (org.members || [])
        .filter((member: any) => member.role === UserRole.CLIENT)
        .map((member: any) => member.userId)

      if (clientMemberIds.length === 0) {
        continue
      }

      const users = await UserModel.find({
        _id: { $in: clientMemberIds },
        deletedAt: null,
        status: "ACTIVE"
      })
        .select("_id name email notificationEmail preferences defaultOrganizationId")
        .lean()

      for (const user of users as any[]) {
        clientsScanned += 1
        const recipientEmail = getNotificationEmail(user)
        if (!recipientEmail || user.preferences?.emailNotifications === false) {
          skipped += 1
          continue
        }

        const baseLogQuery = {
          organizationId: new mongoose.Types.ObjectId(org._id),
          userId: new mongoose.Types.ObjectId(user._id),
          weekKey
        }

        if (!force) {
          const existing = await ClientDigestLogModel.findOne(baseLogQuery)
            .select("_id status")
            .lean()
          if (existing?.status === "SENT" || existing?.status === "PROCESSING") {
            skipped += 1
            continue
          }
        }

        if (dryRun) {
          sent += 1
          continue
        }

        await ClientDigestLogModel.findOneAndUpdate(
          baseLogQuery,
          { $set: { status: "PROCESSING", error: null } },
          { upsert: true, new: true }
        )

        const accessContext: OrganizationAccessContext = {
          user: {
            _id: user._id.toString(),
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            defaultOrganizationId: user.defaultOrganizationId?.toString()
          },
          org: {
            _id: org._id.toString(),
            name: org.name,
            slug: org.slug,
            owner: org.owner.toString()
          },
          orgRole: UserRole.CLIENT
        }

        const overview = await getClientOverviewData(accessContext)
        const delivered = await sendClientWeeklyDigestEmail({
          to: recipientEmail,
          recipientName: user.name,
          overview
        })

        if (delivered) {
          sent += 1
          await ClientDigestLogModel.updateOne(baseLogQuery, {
            $set: { status: "SENT", sentAt: new Date(), error: null }
          })
        } else {
          failed += 1
          await ClientDigestLogModel.updateOne(baseLogQuery, {
            $set: { status: "FAILED", error: "Email delivery returned false" }
          })
        }
      }
    }

    return NextResponse.json({
      weekKey,
      scope,
      dryRun,
      force,
      organizationsScanned,
      clientsScanned,
      sent,
      skipped,
      failed
    })
  } catch (error: any) {
    console.error("Client weekly digest cron error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to send weekly digests" },
      { status: 500 }
    )
  }
}
