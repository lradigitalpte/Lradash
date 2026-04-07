"use server"

import crypto from "crypto"

import { InvitationModel } from "@/models/invitation.model"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

import { connectToDatabase } from "./connect"

export interface Invitation {
  email: string
  organizationId: string
  token: string
  expiresAt: Date
  invitedBy: string
  role: UserRole
  createdAt: Date
}

const INVITATION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

function buildInvitationUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
  return baseUrl ? `${baseUrl}/invite/${token}` : `/invite/${token}`
}

function normalizeInvitationRole(role: unknown, requesterRole: UserRole): UserRole {
  const normalizedRole = String(role ?? UserRole.MEMBER).toUpperCase() as UserRole
  const allowedRoles = new Set<UserRole>([UserRole.MEMBER, UserRole.ADMIN, UserRole.CLIENT])
  const safeRole = allowedRoles.has(normalizedRole) ? normalizedRole : UserRole.MEMBER

  if (requesterRole === UserRole.OWNER) {
    return safeRole
  }

  if (safeRole === UserRole.ADMIN) {
    return UserRole.MEMBER
  }

  return safeRole
}

async function expireInvitationIfNeeded(token: string) {
  await InvitationModel.updateOne(
    { token, status: "PENDING", expiresAt: { $lt: new Date() } },
    { $set: { status: "EXPIRED" } }
  )
}

/**
 * Send an invitation to join an organization
 */
export async function inviteUserToOrganization(
  organizationId: string,
  email: string,
  invitedById: string,
  role: UserRole = UserRole.MEMBER
): Promise<{ success: boolean; error?: string; token?: string; invitationUrl?: string }> {
  try {
    await connectToDatabase()

    // Check if organization exists
    const org = await OrganizationModel.findById(organizationId)
    if (!org) {
      return { success: false, error: "Organization not found" }
    }

    // Check if user is already a member
    const existingMember = org.members.find((m) => m.userId.toString() === invitedById)
    if (!existingMember) {
      return { success: false, error: "You are not a member of this organization" }
    }

    if (org.settings?.allowInvitations === false) {
      return { success: false, error: "Invitations are disabled for this organization" }
    }

    const finalRole = normalizeInvitationRole(role, existingMember.role)

    // Check if user already exists
    const normalizedEmail = email.toLowerCase().trim()
    const existingUser = await UserModel.findOne({ email: normalizedEmail })
    if (existingUser) {
      // Add user to organization directly
      const alreadyMember = org.members.find(
        (m) => m.userId.toString() === existingUser._id.toString()
      )
      if (alreadyMember) {
        return { success: false, error: "User is already a member" }
      }

      org.members.push({
        userId: existingUser._id,
        role: finalRole,
        joinedAt: new Date()
      })

      if (!existingUser.defaultOrganizationId) {
        existingUser.defaultOrganizationId = org._id as any
        await existingUser.save()
      }

      await org.save()

      return { success: true }
    }

    await InvitationModel.updateMany(
      {
        organizationId,
        email: normalizedEmail,
        status: "PENDING",
        expiresAt: { $lt: new Date() }
      },
      { $set: { status: "EXPIRED" } }
    )

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + INVITATION_EXPIRY_MS)

    const invitation = await InvitationModel.findOneAndUpdate(
      {
        organizationId,
        email: normalizedEmail,
        status: "PENDING"
      },
      {
        $set: {
          token,
          expiresAt,
          invitedBy: invitedById,
          role: finalRole,
          acceptedAt: null,
          acceptedBy: null
        },
        $setOnInsert: {
          email: normalizedEmail,
          organizationId,
          status: "PENDING"
        }
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    ).lean()

    if (!invitation) {
      return { success: false, error: "Failed to create invitation" }
    }

    return {
      success: true,
      token: invitation.token,
      invitationUrl: buildInvitationUrl(invitation.token)
    }
  } catch (error) {
    console.error("Invite error:", error)
    return { success: false, error: "Failed to send invitation" }
  }
}

/**
 * Accept an invitation and create user
 */
export async function acceptInvitation(
  token: string,
  name: string,
  password: string
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    await connectToDatabase()

    await expireInvitationIfNeeded(token)

    const invitation = await InvitationModel.findOne({ token, status: "PENDING" }).lean()
    if (!invitation) {
      return { success: false, error: "Invalid invitation" }
    }

    if (invitation.expiresAt < new Date()) {
      await InvitationModel.updateOne({ _id: invitation._id }, { $set: { status: "EXPIRED" } })
      return { success: false, error: "Invitation has expired" }
    }

    // Check if user already exists
    let user = await UserModel.findOne({ email: invitation.email })
    if (user) {
      const org = await OrganizationModel.findById(invitation.organizationId)

      if (!org) {
        return { success: false, error: "Organization not found" }
      }

      const alreadyMember = org.members.some(
        (m: any) => m.userId.toString() === user!._id.toString()
      )
      if (alreadyMember) {
        await InvitationModel.updateOne(
          { _id: invitation._id },
          {
            $set: {
              status: "ACCEPTED",
              acceptedAt: new Date(),
              acceptedBy: user._id
            }
          }
        )
        return { success: true, userId: user._id.toString() }
      }

      org.members.push({
        userId: user._id,
        role: invitation.role,
        joinedAt: new Date()
      })
      await org.save()

      if (!user.defaultOrganizationId) {
        user.defaultOrganizationId = org._id as any
        await user.save()
      }

      await InvitationModel.updateOne(
        { _id: invitation._id },
        {
          $set: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            acceptedBy: user._id
          }
        }
      )

      return { success: true, userId: user._id.toString() }
    }

    if (!name.trim() || !password.trim()) {
      return { success: false, error: "Name and password are required" }
    }

    // Import password hashing
    const { hashPassword } = await import("@/lib/auth/password")

    // Create user
    const passwordHash = await hashPassword(password)
    user = await UserModel.create({
      email: invitation.email,
      name,
      passwordHash,
      status: "ACTIVE",
      defaultOrganizationId: invitation.organizationId,
      role: invitation.role
    } as any)

    // Add to organization
    const org = await OrganizationModel.findById(invitation.organizationId)
    if (org) {
      org.members.push({
        userId: user._id,
        role: invitation.role,
        joinedAt: new Date()
      })
      await org.save()
    }

    await InvitationModel.updateOne(
      { _id: invitation._id },
      {
        $set: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
          acceptedBy: user._id
        }
      }
    )

    return { success: true, userId: user._id.toString() }
  } catch (error) {
    console.error("Accept invitation error:", error)
    return { success: false, error: "Failed to accept invitation" }
  }
}

/**
 * Get invitation details
 */
export async function getInvitation(token: string): Promise<Invitation | null> {
  await connectToDatabase()
  await expireInvitationIfNeeded(token)

  const invitation = await InvitationModel.findOne({ token, status: "PENDING" }).lean()
  if (!invitation || invitation.expiresAt < new Date()) {
    return null
  }

  return {
    email: invitation.email,
    organizationId: invitation.organizationId.toString(),
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    invitedBy: invitation.invitedBy.toString(),
    role: invitation.role,
    createdAt: invitation.createdAt
  }
}
