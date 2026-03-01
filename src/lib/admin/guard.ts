import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

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
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const token = authHeader.substring(7)
  const decoded = verifyAccessToken(token)
  if (!decoded?.email) {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) }
  }

  await connectToDatabase()

  const user = await UserModel.findOne({
    email: decoded.email.toLowerCase(),
    deletedAt: null
  }).lean()

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) }
  }

  const orgId = (user as any).defaultOrganizationId
  if (!orgId) {
    return { error: NextResponse.json({ error: "No organization associated" }, { status: 403 }) }
  }

  const org = await OrganizationModel.findById(orgId).lean()
  if (!org) {
    return { error: NextResponse.json({ error: "Organization not found" }, { status: 404 }) }
  }

  const userId = (user as any)._id.toString()
  const isOwner = (org as any).owner.toString() === userId
  const memberEntry = (org as any).members?.find((m: any) => m.userId.toString() === userId)
  const isAdmin = memberEntry?.role === "ADMIN" || memberEntry?.role === "OWNER"

  if (!isOwner && !isAdmin) {
    return {
      error: NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }
  }

  return {
    user: {
      _id: userId,
      email: (user as any).email,
      name: (user as any).name,
      avatar: (user as any).avatar
    },
    orgId: orgId.toString()
  }
}
