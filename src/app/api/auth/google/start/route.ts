import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import {
  generateGoogleWorkspaceAuthUrl,
  GOOGLE_WORKSPACE_SCOPES,
  hasGoogleCalendarEventsScope
} from "@/lib/google/workspace"
import { GoogleWorkspaceAccountModel } from "@/models/google-workspace-account.model"
import { ProjectModel } from "@/models/project.model"

export async function GET(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId") || undefined
    const returnTo = searchParams.get("returnTo") || undefined
    const force = searchParams.get("force") === "true"

    if (projectId) {
      const project = await ProjectModel.findOne({
        _id: projectId,
        organizationId: access.org._id,
        deletedAt: null
      }).lean()

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }
    }

    const existingAccount = await GoogleWorkspaceAccountModel.findOne({
      organizationId: access.org._id,
      userId: access.user._id,
      isActive: true
    }).lean()

    if (existingAccount && !force && hasGoogleCalendarEventsScope(existingAccount.scopes)) {
      return NextResponse.json({
        connected: true,
        accountEmail: existingAccount.email || null,
        scopes: existingAccount.scopes || []
      })
    }

    const authUrl = await generateGoogleWorkspaceAuthUrl(
      {
        orgId: access.org._id,
        userId: access.user._id,
        projectId,
        returnTo
      },
      request
    )

    const storedScopes = existingAccount?.scopes || []
    const needsCalendarReconnect = Boolean(
      existingAccount && !force && !hasGoogleCalendarEventsScope(storedScopes)
    )

    return NextResponse.json({
      connected: false,
      authUrl,
      scopes: needsCalendarReconnect ? storedScopes : GOOGLE_WORKSPACE_SCOPES,
      accountEmail: existingAccount?.email || null,
      needsCalendarReconnect
    })
  } catch (error) {
    console.error("Start Google auth error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start Google auth" },
      { status: 500 }
    )
  }
}
