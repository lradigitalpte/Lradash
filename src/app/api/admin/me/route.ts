import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"

/**
 * GET /api/admin/me
 * Returns whether the authenticated user has admin access in their org.
 * Used by the UI to show/hide admin navigation.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return NextResponse.json({ isAdmin: false })
  }
  return NextResponse.json({ isAdmin: true, user: guard.user })
}
