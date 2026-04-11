import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { disconnectGoogleWorkspaceAccount } from "@/lib/google/workspace"

export async function POST(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    await disconnectGoogleWorkspaceAccount(access, request)

    return NextResponse.json({
      success: true,
      message: "Google Calendar disconnected successfully"
    })
  } catch (error) {
    console.error("Disconnect Google auth error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect Google Calendar" },
      { status: 500 }
    )
  }
}
