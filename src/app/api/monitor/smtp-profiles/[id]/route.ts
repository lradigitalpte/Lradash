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

function serializeProfile(doc: LeanSmtpProfile) {
  return {
    id: doc._id.toString(),
    label: doc.label,
    host: doc.host,
    port: doc.port,
    secure: doc.secure,
    authUser: doc.authUser,
    fromName: doc.fromName ?? "",
    fromEmail: doc.fromEmail,
    lastTestAt: doc.lastTestAt ?? null,
    lastTestOk: doc.lastTestOk ?? null,
    lastTestMessage: doc.lastTestMessage ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

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

    const profile = await SmtpProfileModel.findOne({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    })
    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))

    if (typeof body.label === "string" && body.label.trim()) {
      profile.label = body.label.trim()
    }
    if (typeof body.host === "string" && body.host.trim()) {
      profile.host = body.host.trim()
    }
    if (body.port !== undefined) {
      const port = Number(body.port)
      if (!Number.isFinite(port) || port < 1 || port > 65535) {
        return NextResponse.json({ error: "Invalid port" }, { status: 400 })
      }
      profile.port = port
    }
    if (typeof body.secure === "boolean") {
      profile.secure = body.secure
    }
    if (typeof body.authUser === "string" && body.authUser.trim()) {
      profile.authUser = body.authUser.trim()
    }
    if (typeof body.fromName === "string") {
      profile.fromName = body.fromName.trim()
    }
    if (typeof body.fromEmail === "string" && body.fromEmail.trim()) {
      profile.fromEmail = body.fromEmail.trim().toLowerCase()
    }
    if (typeof body.password === "string" && body.password.length > 0) {
      profile.passwordEnc = encryptData(body.password)
    }

    await profile.save()

    return NextResponse.json({ profile: serializeProfile(profile.toObject()) })
  } catch (e: unknown) {
    console.error("[smtp-profiles PATCH]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 })
    }

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

    const result = await SmtpProfileModel.deleteOne({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    console.error("[smtp-profiles DELETE]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
