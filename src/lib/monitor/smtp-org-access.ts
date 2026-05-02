import type { DecodedToken } from "@/lib/auth/tokens"
import mongoose from "mongoose"

import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

export async function getOrganizationIdForUser(decoded: DecodedToken): Promise<string | null> {
  let organizationId = decoded.organizationId
  if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    const user = await UserModel.findById(decoded.userId).select("defaultOrganizationId").lean()
    organizationId = (
      user as { defaultOrganizationId?: mongoose.Types.ObjectId } | null
    )?.defaultOrganizationId?.toString()
  }
  if (!organizationId || !mongoose.Types.ObjectId.isValid(String(organizationId))) {
    return null
  }
  return String(organizationId)
}

export async function getOrgRoleForUser(
  userId: string,
  organizationId: string
): Promise<"OWNER" | "ADMIN" | "MEMBER" | "CLIENT" | null> {
  const org = await OrganizationModel.findById(organizationId).lean()
  if (!org) {
    return null
  }
  const raw = org as unknown as {
    owner?: mongoose.Types.ObjectId | string
    members?: Array<{ userId?: mongoose.Types.ObjectId | string; role?: string }>
  }
  const ownerId = raw.owner != null ? String(raw.owner) : ""
  if (ownerId === String(userId)) {
    return "OWNER"
  }
  const entry = (raw.members ?? []).find((m) => String(m.userId) === String(userId))
  const role = entry?.role
  if (role === "OWNER" || role === "ADMIN" || role === "MEMBER" || role === "CLIENT") {
    return role
  }
  return null
}

export function roleCanManageSmtpProfiles(role: string | null): boolean {
  return role === "OWNER" || role === "ADMIN"
}
