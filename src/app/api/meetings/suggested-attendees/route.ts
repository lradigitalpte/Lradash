import { NextRequest, NextResponse } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { hasGoogleCalendarEventsScope } from "@/lib/google/workspace"
import { GoogleWorkspaceAccountModel } from "@/models/google-workspace-account.model"
import { OrganizationModel } from "@/models/organization.model"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

export interface SuggestedAttendee {
  userId: string
  name: string
  email: string
  /** Has linked Google Workspace account with Calendar scope in this org — invites go to their calendar reliably. */
  googleCalendarConnected: boolean
}

/**
 * GET /api/meetings/suggested-attendees?projectId=optional
 * People to invite to Calendar events: project team (if projectId) or whole org, with Google connection flags.
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireOrganizationAccess(request)
    if ("error" in access) {
      return access.error
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId") || undefined

    const orgId = access.org._id
    const userIds = new Set<string>()

    if (projectId) {
      const project = await ProjectModel.findOne({
        _id: projectId,
        organizationId: orgId,
        deletedAt: null
      } as any)
        .select("owner members")
        .lean()

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      const ownerId = (project as any).owner?.toString()
      if (ownerId) {
        userIds.add(ownerId)
      }
      for (const m of (project as any).members || []) {
        const id = m?.toString?.() ?? String(m)
        if (id) {
          userIds.add(id)
        }
      }
    } else {
      const org = await OrganizationModel.findById(orgId).select("owner members.userId").lean()
      if (!org) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 })
      }
      const ownerId = (org as any).owner?.toString()
      if (ownerId) {
        userIds.add(ownerId)
      }
      for (const entry of (org as any).members || []) {
        const uid = entry?.userId?.toString?.() ?? String(entry?.userId)
        if (uid) {
          userIds.add(uid)
        }
      }
    }

    const ids = Array.from(userIds).filter((id) => id && id !== "undefined")
    if (ids.length === 0) {
      return NextResponse.json({ people: [] as SuggestedAttendee[] })
    }

    const users = await UserModel.find({ _id: { $in: ids } })
      .select("name email")
      .lean()

    const accounts = await GoogleWorkspaceAccountModel.find({
      organizationId: orgId,
      userId: { $in: ids },
      isActive: true
    })
      .select("userId scopes")
      .lean()

    const scopeByUser = new Map<string, string[]>()
    for (const a of accounts) {
      const uid = (a as any).userId?.toString()
      if (uid) {
        scopeByUser.set(uid, ((a as any).scopes || []) as string[])
      }
    }

    const people: SuggestedAttendee[] = users
      .map((u: any) => {
        const id = u._id.toString()
        const email = (u.email as string) || ""
        if (!email) {
          return null
        }
        return {
          userId: id,
          name: (u.name as string) || email,
          email,
          googleCalendarConnected: hasGoogleCalendarEventsScope(scopeByUser.get(id))
        }
      })
      .filter(Boolean) as SuggestedAttendee[]

    people.sort((a, b) => {
      if (a.googleCalendarConnected !== b.googleCalendarConnected) {
        return a.googleCalendarConnected ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ people })
  } catch (error) {
    console.error("suggested-attendees error:", error)
    return NextResponse.json({ error: "Failed to load attendees" }, { status: 500 })
  }
}
