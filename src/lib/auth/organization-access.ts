import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

export interface OrganizationAccessContext {
  user: {
    _id: string
    email: string
    name: string
    avatar?: string
    defaultOrganizationId?: string
  }
  org: {
    _id: string
    name: string
    slug: string
    owner: string
  }
  orgRole: UserRole
}

export type OrganizationAccessResult = { error: NextResponse } | OrganizationAccessContext

export async function requireOrganizationAccess(
  request: NextRequest
): Promise<OrganizationAccessResult> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const decoded = verifyAccessToken(authHeader.substring(7))
  if (!decoded?.userId) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) }
  }

  await connectToDatabase()

  const user = await UserModel.findById(decoded.userId)
    .select("email name avatar defaultOrganizationId deletedAt")
    .lean()

  if (!user || user.deletedAt) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) }
  }

  const orgId = user.defaultOrganizationId?.toString()
  if (!orgId) {
    return { error: NextResponse.json({ error: "No organization associated" }, { status: 403 }) }
  }

  const org = await OrganizationModel.findById(orgId).select("name slug owner members").lean()
  if (!org) {
    return { error: NextResponse.json({ error: "Organization not found" }, { status: 404 }) }
  }

  const userId = user._id.toString()
  const isOwner = org.owner.toString() === userId
  const memberEntry = (org.members as any[]).find((member) => member.userId.toString() === userId)

  if (!isOwner && !memberEntry) {
    return {
      error: NextResponse.json(
        { error: "Forbidden: Organization membership required" },
        { status: 403 }
      )
    }
  }

  return {
    user: {
      _id: userId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      defaultOrganizationId: orgId
    },
    org: {
      _id: orgId,
      name: org.name,
      slug: org.slug,
      owner: org.owner.toString()
    },
    orgRole: isOwner ? UserRole.OWNER : ((memberEntry?.role as UserRole) ?? UserRole.MEMBER)
  }
}

export async function requireClientAccess(request: NextRequest): Promise<OrganizationAccessResult> {
  const access = await requireOrganizationAccess(request)
  if ("error" in access) {
    return access
  }

  if (access.orgRole !== UserRole.CLIENT) {
    return {
      error: NextResponse.json({ error: "Forbidden: Client access required" }, { status: 403 })
    }
  }

  return access
}
