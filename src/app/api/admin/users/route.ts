import { NextRequest, NextResponse } from "next/server"

import { requireAdmin } from "@/lib/admin/guard"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

/**
 * GET /api/admin/users
 * Returns all users in the organization with their roles.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const { orgId } = guard

  await connectToDatabase()

  const org = await OrganizationModel.findById(orgId).lean()
  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  const ownerIdStr = (org as any).owner.toString()
  const memberMap = new Map<string, string>()
  for (const m of (org as any).members ?? []) {
    memberMap.set(m.userId.toString(), m.role)
  }

  // Deduplicate: owner may also appear in members array
  const allUserIds = Array.from(new Set([ownerIdStr, ...Array.from(memberMap.keys())]))

  const users = await UserModel.find({ _id: { $in: allUserIds }, deletedAt: null })
    .select("_id name email avatar role status createdAt")
    .sort({ createdAt: -1 })
    .lean()

  const enriched = users.map((u: any) => ({
    _id: u._id.toString(),
    name: u.name,
    email: u.email,
    avatar: u.avatar ?? null,
    status: u.status,
    createdAt: u.createdAt,
    orgRole:
      u._id.toString() === ownerIdStr ? "OWNER" : (memberMap.get(u._id.toString()) ?? "MEMBER")
  }))

  return NextResponse.json({ users: enriched })
}

/**
 * PATCH /api/admin/users
 * Update a user's org role or platform status.
 * Body: { userId, orgRole?: "ADMIN"|"MEMBER", status?: "ACTIVE"|"SUSPENDED" }
 */
export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(request)
  if ("error" in guard) {
    return guard.error
  }

  const { orgId, user: adminUser } = guard

  let body: { userId?: string; orgRole?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { userId, orgRole, status } = body
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  await connectToDatabase()

  // Prevent self-demotion
  if (userId === adminUser._id && orgRole === "MEMBER") {
    return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 })
  }

  const updates: Promise<any>[] = []

  if (status && ["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
    updates.push(UserModel.findByIdAndUpdate(userId, { status }, { new: true }).lean())
  }

  if (orgRole && ["ADMIN", "MEMBER"].includes(orgRole)) {
    updates.push(
      OrganizationModel.findByIdAndUpdate(
        orgId,
        { $set: { "members.$[elem].role": orgRole } },
        { arrayFilters: [{ "elem.userId": userId }], new: true }
      ).lean()
    )
  }

  await Promise.all(updates)

  return NextResponse.json({ success: true, message: "User updated" })
}
