import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"

export type AdminGuardResult =
  | { error: NextResponse }
  | {
      user: { _id: string; email: string; name: string; avatar?: string }
      orgId: string
    }

/**
 * Checks that the request comes from an authenticated user who is
 * an OWNER or ADMIN of their default organization.
 */
export async function requireAdmin(request: NextRequest): Promise<AdminGuardResult> {
  const access = await requireOrganizationAccess(request)
  if ("error" in access) {
    return access
  }

  if (!["OWNER", "ADMIN"].includes(access.orgRole)) {
    return {
      error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
  }

  return {
    user: {
      _id: access.user._id,
      email: access.user.email,
      name: access.user.name,
      avatar: access.user.avatar
    },
    orgId: access.org._id
  }
}
