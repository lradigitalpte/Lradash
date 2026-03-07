import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

/**
 * Returns user IDs of everyone in the same org as the given user (owner + members).
 * Used to scope org-wide resources (e.g. monitors) so all members see the same data.
 */
export async function getOrgMemberIds(userId: string): Promise<string[] | null> {
  const user = await UserModel.findById(userId).select("defaultOrganizationId").lean()
  if (!user?.defaultOrganizationId) {return null}
  const org = await OrganizationModel.findById(user.defaultOrganizationId).lean()
  if (!org) {return null}
  const ownerId = (org as any).owner?.toString()
  const memberIds = ((org as any).members ?? [])
    .map((m: any) => m.userId?.toString())
    .filter(Boolean)
  const all = new Set<string>([ownerId, ...memberIds].filter(Boolean))
  return Array.from(all)
}
