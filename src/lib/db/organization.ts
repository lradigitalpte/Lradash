"use server"

import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"
import { connectToDatabase } from "./connect"
import { Organization, UserRole, SubscriptionPlan, SubscriptionStatus } from "@/types/dbInterface"

// ========== CREATE ORGANIZATION ==========
export async function createOrganization(
  data: { name: string; slug: string; owner: string }
): Promise<Organization | null> {
  try {
    await connectToDatabase()

    const { name, slug, owner } = data

    // Validate inputs
    if (!name || typeof name !== "string") {
      throw new Error("Invalid organization name")
    }
    if (!slug || typeof slug !== "string") {
      throw new Error("Invalid organization slug")
    }
    if (!owner) {
      throw new Error("Organization owner is required")
    }

    // Generate final slug (lowercase, trim, replace spaces)
    const finalSlug = slug.toLowerCase().trim().replace(/\s+/g, "-")

    // Check if slug already exists
    const existingOrg = await OrganizationModel.findOne({ slug: finalSlug })
    if (existingOrg) {
      console.error("Organization slug already exists")
      return null
    }

    const organization = await OrganizationModel.create({
      name,
      slug: finalSlug,
      owner: owner,
      members: [
        {
          userId: owner,
          role: UserRole.OWNER,
          joinedAt: new Date()
        }
      ],
      subscription: {
        plan: SubscriptionPlan.FREE,
        status: SubscriptionStatus.ACTIVE
      }
    })

    // Update user's default organization
    await UserModel.updateOne(
      { _id: ownerId },
      { defaultOrganizationId: organization._id }
    )

    return organization.toObject()
  } catch (error) {
    console.error("Error creating organization:", error)
    return null
  }
}

// ========== GET ORGANIZATION ==========
export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  try {
    await connectToDatabase()
    const org = await OrganizationModel.findOne({ _id: orgId, deletedAt: null })
      .populate("owner", "name email avatar")
      .populate("members.userId", "name email avatar")
      .lean()

    if (!org) {
      console.error("Organization not found")
      return null
    }

    return org as Organization
  } catch (error) {
    console.error("Error fetching organization:", error)
    return null
  }
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  try {
    await connectToDatabase()
    const org = await OrganizationModel.findOne({ slug, deletedAt: null })
      .populate("owner", "name email avatar")
      .populate("members.userId", "name email avatar")
      .lean()

    if (!org) {
      console.error("Organization not found")
      return null
    }

    return org as Organization
  } catch (error) {
    console.error("Error fetching organization by slug:", error)
    return null
  }
}

// ========== GET USER'S ORGANIZATIONS ==========
export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  try {
    await connectToDatabase()
    const organizations = await OrganizationModel.find(
      {
        "members.userId": userId,
        deletedAt: null
      },
      "-__v"
    )
      .populate("owner", "name email avatar")
      .populate("members.userId", "name email avatar")
      .sort({ createdAt: -1 })
      .lean()

    return organizations as Organization[]
  } catch (error) {
    console.error("Error fetching user organizations:", error)
    return []
  }
}

// ========== ADD MEMBER TO ORGANIZATION ==========
export async function addMemberToOrganization(
  orgId: string,
  userId: string,
  role: UserRole = UserRole.MEMBER
): Promise<boolean> {
  try {
    await connectToDatabase()

    // Check if member already exists
    const org = await OrganizationModel.findById(orgId)
    if (!org) {
      console.error("Organization not found")
      return false
    }

    const memberExists = org.members.some((m: any) => m.userId.toString() === userId)
    if (memberExists) {
      console.error("User is already a member")
      return false
    }

    // Add member
    await OrganizationModel.updateOne(
      { _id: orgId },
      {
        $push: {
          members: {
            userId,
            role,
            joinedAt: new Date()
          }
        }
      }
    )

    return true
  } catch (error) {
    console.error("Error adding member to organization:", error)
    return false
  }
}

// ========== UPDATE MEMBER ROLE ==========
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: UserRole
): Promise<boolean> {
  try {
    await connectToDatabase()

    const result = await OrganizationModel.updateOne(
      { _id: orgId, "members.userId": userId },
      { $set: { "members.$.role": role } }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error updating member role:", error)
    return false
  }
}

// ========== REMOVE MEMBER FROM ORGANIZATION ==========
export async function removeMemberFromOrganization(orgId: string, userId: string): Promise<boolean> {
  try {
    await connectToDatabase()

    const org = await OrganizationModel.findById(orgId)
    if (!org) {
      console.error("Organization not found")
      return false
    }

    // Prevent removing the owner
    if (org.owner.toString() === userId) {
      console.error("Cannot remove organization owner")
      return false
    }

    const result = await OrganizationModel.updateOne(
      { _id: orgId },
      {
        $pull: { members: { userId } }
      }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error removing member:", error)
    return false
  }
}

// ========== GET MEMBER ROLE ==========
export async function getMemberRole(orgId: string, userId: string): Promise<UserRole | null> {
  try {
    await connectToDatabase()

    const org = await OrganizationModel.findOne(
      { _id: orgId, "members.userId": userId },
      { "members.$": 1 }
    ).lean()

    if (!org || !org.members.length) {
      return null
    }

    return org.members[0].role as UserRole
  } catch (error) {
    console.error("Error fetching member role:", error)
    return null
  }
}

// ========== CHECK PERMISSION ==========
export async function hasPermission(
  orgId: string,
  userId: string,
  requiredRole: UserRole
): Promise<boolean> {
  try {
    const roleHierarchy = { OWNER: 3, ADMIN: 2, MEMBER: 1 }
    const memberRole = await getMemberRole(orgId, userId)

    if (!memberRole) return false

    return roleHierarchy[memberRole as UserRole] >= roleHierarchy[requiredRole]
  } catch (error) {
    console.error("Error checking permission:", error)
    return false
  }
}

// ========== UPDATE ORGANIZATION ==========
export async function updateOrganization(
  orgId: string,
  updates: Partial<Organization>
): Promise<Organization | null> {
  try {
    await connectToDatabase()

    // Prevent updating sensitive fields
    const { owner, members, ...safeUpdates } = updates

    const updatedOrg = await OrganizationModel.findByIdAndUpdate(orgId, safeUpdates, {
      new: true
    })
      .populate("owner", "name email avatar")
      .populate("members.userId", "name email avatar")

    return updatedOrg?.toObject() || null
  } catch (error) {
    console.error("Error updating organization:", error)
    return null
  }
}

// ========== SOFT DELETE ORGANIZATION ==========
export async function softDeleteOrganization(orgId: string): Promise<boolean> {
  try {
    await connectToDatabase()

    const result = await OrganizationModel.updateOne(
      { _id: orgId },
      { deletedAt: new Date() }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error deleting organization:", error)
    return false
  }
}

// ========== UPDATE SUBSCRIPTION ==========
export async function updateSubscription(
  orgId: string,
  plan: SubscriptionPlan,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  currentPeriodEnd?: Date
): Promise<boolean> {
  try {
    await connectToDatabase()

    const result = await OrganizationModel.updateOne(
      { _id: orgId },
      {
        $set: {
          "subscription.plan": plan,
          "subscription.status": SubscriptionStatus.ACTIVE,
          ...(stripeCustomerId && { "subscription.stripeCustomerId": stripeCustomerId }),
          ...(stripeSubscriptionId && { "subscription.stripeSubscriptionId": stripeSubscriptionId }),
          ...(currentPeriodEnd && { "subscription.currentPeriodEnd": currentPeriodEnd })
        }
      }
    )

    return result.modifiedCount > 0
  } catch (error) {
    console.error("Error updating subscription:", error)
    return false
  }
}
