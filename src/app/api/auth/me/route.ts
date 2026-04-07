import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"

export async function GET(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    return NextResponse.json(
      {
        id: access.user._id,
        email: access.user.email,
        name: access.user.name,
        avatar: access.user.avatar || null,
        orgRole: access.orgRole,
        isClient: access.orgRole === "CLIENT",
        organization: {
          id: access.org._id,
          name: access.org.name,
          slug: access.org.slug
        }
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
