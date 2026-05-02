import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getFromAddress, getTransporter } from "@/lib/email/transporter"
import { UserModel } from "@/models/user.model"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    const body = await request.json().catch(() => ({}))
    let to = typeof body.to === "string" ? body.to.trim().toLowerCase() : ""

    await connectToDatabase()
    if (!to) {
      const user = await UserModel.findById(decoded.userId).select("email").lean()
      to = String((user as { email?: string } | null)?.email ?? "")
    }

    if (!to || !EMAIL_RE.test(to)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Enter a valid recipient email or leave blank to use your account email."
        },
        { status: 400 }
      )
    }

    const transporter = getTransporter()
    if (!transporter) {
      return NextResponse.json(
        {
          ok: false,
          configured: false,
          error: "SMTP is not configured on this server (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD)."
        },
        { status: 503 }
      )
    }

    const info = await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject: "LRADASH — SMTP test (Monitor)",
      text: `Test email from LRADASH Infrastructure Monitor at ${new Date().toISOString()}`,
      html: `<p>Test email from <strong>LRADASH</strong> (Monitor → Infrastructure).</p><p><small>${new Date().toISOString()}</small></p>`
    })

    return NextResponse.json({
      ok: true,
      configured: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      to
    })
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string }
    console.error("[smtp-test]", err)
    return NextResponse.json(
      {
        ok: false,
        configured: true,
        error: err?.message || "Failed to send",
        code: err?.code
      },
      { status: 502 }
    )
  }
}
