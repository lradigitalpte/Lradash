import type { SmtpProfileDoc } from "@/models/smtp-profile.model"
import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import {
  getOrganizationIdForUser,
  getOrgRoleForUser,
  roleCanManageSmtpProfiles
} from "@/lib/monitor/smtp-org-access"
import { encryptData } from "@/lib/seo/encryption"
import { SmtpProfileModel } from "@/models/smtp-profile.model"

type LeanSmtpProfile = mongoose.FlattenMaps<SmtpProfileDoc> & { _id: mongoose.Types.ObjectId }

function serializeProfile(doc: LeanSmtpProfile, maskAuth = false) {
  return {
    id: doc._id.toString(),
    label: doc.label,
    host: doc.host,
    port: doc.port,
    secure: doc.secure,
    authUser: maskAuth ? "••••••••" : doc.authUser,
    fromName: doc.fromName ?? "",
    fromEmail: doc.fromEmail,
    lastTestAt: doc.lastTestAt ?? null,
    lastTestOk: doc.lastTestOk ?? null,
    lastTestMessage: doc.lastTestMessage ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
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
    const organizationId = await getOrganizationIdForUser(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const role = await getOrgRoleForUser(decoded.userId, organizationId)
    const canManage = roleCanManageSmtpProfiles(role)

    const rows = await SmtpProfileModel.find({ organizationId }).sort({ updatedAt: -1 }).lean()

    return NextResponse.json({
      profiles: rows.map((r) => serializeProfile(r, !canManage)),
      canManage
    })
  } catch (e: unknown) {
    console.error("[smtp-profiles GET]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
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
    const organizationId = await getOrganizationIdForUser(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const role = await getOrgRoleForUser(decoded.userId, organizationId)
    if (!roleCanManageSmtpProfiles(role)) {
      return NextResponse.json({ error: "Owner or admin required" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const label = typeof body.label === "string" ? body.label.trim() : ""
    const host = typeof body.host === "string" ? body.host.trim() : ""
    const port = Number(body.port ?? 587)
    const secure = Boolean(body.secure)
    const authUser = typeof body.authUser === "string" ? body.authUser.trim() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const fromName = typeof body.fromName === "string" ? body.fromName.trim() : ""
    const fromEmail = typeof body.fromEmail === "string" ? body.fromEmail.trim().toLowerCase() : ""

    if (!label || !host || !authUser || !password || !fromEmail) {
      return NextResponse.json(
        { error: "label, host, authUser, password, and fromEmail are required" },
        { status: 400 }
      )
    }
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      return NextResponse.json({ error: "Invalid port" }, { status: 400 })
    }

    const passwordEnc = encryptData(password)

    const created = await SmtpProfileModel.create({
      organizationId: new mongoose.Types.ObjectId(organizationId),
      label,
      host,
      port,
      secure,
      authUser,
      passwordEnc,
      fromName,
      fromEmail,
      createdBy: new mongoose.Types.ObjectId(decoded.userId)
    })

    return NextResponse.json({ profile: serializeProfile(created.toObject()) })
  } catch (e: unknown) {
    console.error("[smtp-profiles POST]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
