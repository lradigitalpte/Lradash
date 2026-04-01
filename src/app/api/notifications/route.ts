/**
 * /api/notifications
 *
 * GET  – list notifications for the authenticated user
 * PATCH – mark one or all as read
 */

import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import {
  getUserNotifications,
  countUnread,
  markNotificationRead,
  markAllNotificationsRead
} from "@/lib/db/notification"
import { getUserByEmail } from "@/lib/db/user"

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }
  const decoded = verifyAccessToken(authHeader.substring(7))
  if (!decoded) {
    return null
  }

  if (decoded.userId) {
    return decoded.userId
  }

  if (!decoded.email) {
    return null
  }

  const user = await getUserByEmail(decoded.email)
  return user ? String(user._id) : null
}

export async function GET(request: NextRequest) {
  const userId = await resolveUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [notifications, unreadCount] = await Promise.all([
    getUserNotifications(userId),
    countUnread(userId)
  ])

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const userId = await resolveUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  // Mark all read
  if (body.markAllRead === true) {
    const count = await markAllNotificationsRead(userId)
    return NextResponse.json({ updated: count })
  }

  // Mark single notification read
  if (body.notificationId) {
    const ok = await markNotificationRead(body.notificationId, userId)
    return NextResponse.json({ updated: ok ? 1 : 0 })
  }

  return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
}
