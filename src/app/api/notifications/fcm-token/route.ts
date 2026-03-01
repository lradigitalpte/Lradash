/**
 * POST /api/notifications/fcm-token
 * Saves a Firebase Cloud Messaging registration token for the authenticated user.
 * Called once after the browser obtains a push subscription token.
 */

import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { saveFcmToken } from "@/lib/db/notification"
import { getUserByEmail } from "@/lib/db/user"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const decoded = verifyAccessToken(authHeader.substring(7))
  if (!decoded?.email) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const user = await getUserByEmail(decoded.email)
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const body = await request.json()
  if (!body.token || typeof body.token !== "string") {
    return NextResponse.json({ error: "token is required" }, { status: 400 })
  }

  await saveFcmToken(String(user._id), body.token)
  return NextResponse.json({ success: true })
}
