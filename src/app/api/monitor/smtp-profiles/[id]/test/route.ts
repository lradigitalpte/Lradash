import mongoose from "mongoose"
import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getOrganizationIdForUser, getOrgRoleForUser } from "@/lib/monitor/smtp-org-access"
import { decryptData } from "@/lib/seo/encryption"
import { SmtpProfileModel } from "@/models/smtp-profile.model"
import { UserModel } from "@/models/user.model"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json().catch(() => ({}))
    let to = typeof body.to === "string" ? body.to.trim().toLowerCase() : ""

    await connectToDatabase()
    const organizationId = await getOrganizationIdForUser(decoded)
    if (!organizationId) {
      return NextResponse.json({ error: "No organization" }, { status: 400 })
    }

    const role = await getOrgRoleForUser(decoded.userId, organizationId)
    if (!role) {
      return NextResponse.json({ error: "Not a member of this organization" }, { status: 403 })
    }

    if (!to) {
      const user = await UserModel.findById(decoded.userId).select("email").lean()
      to = String((user as { email?: string } | null)?.email ?? "")
    }
    if (!to || !EMAIL_RE.test(to)) {
      return NextResponse.json(
        { error: "Enter a valid recipient email or leave blank to use your account email." },
        { status: 400 }
      )
    }

    const profile = await SmtpProfileModel.findOne({
      _id: id,
      organizationId: new mongoose.Types.ObjectId(organizationId)
    })
    if (!profile) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const pass = decryptData(profile.passwordEnc)
    const transportOpts: SMTPTransport.Options = {
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      auth: { user: profile.authUser, pass }
    }
    const transporter = nodemailer.createTransport(transportOpts)

    const fromName = profile.fromName?.trim() || "LRADASH Monitor"
    const from = `"${fromName}" <${profile.fromEmail}>`

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject: `LRADASH — SMTP test (${profile.label})`,
        text: `Saved profile "${profile.label}" test at ${new Date().toISOString()}`,
        html: `<p>Saved SMTP profile <strong>${escapeHtml(profile.label)}</strong></p><p><small>${new Date().toISOString()}</small></p>`
      })

      profile.lastTestAt = new Date()
      profile.lastTestOk = true
      profile.lastTestMessage = info.messageId ? `Sent (${info.messageId})` : "Sent"
      await profile.save()

      await transporter.close()

      return NextResponse.json({
        ok: true,
        to,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected,
        lastTestAt: profile.lastTestAt,
        lastTestOk: true
      })
    } catch (sendErr: unknown) {
      const err = sendErr as { message?: string; code?: string }
      profile.lastTestAt = new Date()
      profile.lastTestOk = false
      profile.lastTestMessage = err?.message?.slice(0, 500) ?? "Failed"
      await profile.save()

      try {
        await transporter.close()
      } catch {
        // ignore
      }

      return NextResponse.json(
        {
          ok: false,
          to,
          error: err?.message || "Send failed",
          code: err?.code,
          lastTestAt: profile.lastTestAt,
          lastTestOk: false
        },
        { status: 502 }
      )
    }
  } catch (e: unknown) {
    console.error("[smtp-profiles test]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
