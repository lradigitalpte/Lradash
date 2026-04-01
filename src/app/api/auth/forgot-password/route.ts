import { NextRequest, NextResponse } from "next/server"

import { requestPasswordReset } from "@/lib/auth/auth-service"
import { getAppUrl } from "@/lib/url/get-app-url"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === "string" ? body.email : ""

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    await requestPasswordReset(email, getAppUrl(request))

    return NextResponse.json({
      success: true,
      message: "If an account exists for that email, a reset link has been sent."
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
