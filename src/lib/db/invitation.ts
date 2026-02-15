"use server"

import crypto from "crypto"

import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

import { connectToDatabase } from "./connect"

export interface Invitation {
  email: string
  organizationId: string
  token: string
  expiresAt: Date
  invitedBy: string
  createdAt: Date
}

// Simple in-memory store for invitations (in production, use DB)
const invitations = new Map<string, Invitation>()

/**
 * Send an invitation to join an organization
 */
export async function inviteUserToOrganization(
  organizationId: string,
  email: string,
  invitedById: string,
  role: "MEMBER" | "ADMIN" = "MEMBER"
): Promise<{ success: boolean; error?: string; token?: string }> {
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

    // Check if user already exists
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() })
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
        role: role as any,
        joinedAt: new Date()
      })
      await org.save()

      return { success: true }
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    // Store invitation
    invitations.set(token, {
      email: email.toLowerCase(),
      organizationId: organizationId.toString(),
      token,
      expiresAt,
      invitedBy: invitedById.toString(),
      createdAt: new Date()
    })

    // TODO: Send email with invitation link
    // const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    // await sendInvitationEmail(email, org.name, invitationUrl)

    return { success: true, token }
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
    const invitation = invitations.get(token)
    if (!invitation) {
      return { success: false, error: "Invalid invitation" }
    }

    if (invitation.expiresAt < new Date()) {
      invitations.delete(token)
      return { success: false, error: "Invitation has expired" }
    }

    await connectToDatabase()

    // Check if user already exists
    let user = await UserModel.findOne({ email: invitation.email })
    if (user) {
      return { success: false, error: "User already exists" }
    }

    // Import password hashing
    const { hashPassword } = await import("@/lib/auth/password")

    // Create user
    const passwordHash = await hashPassword(password)
    user = await UserModel.create({
      email: invitation.email,
      name,
      passwordHash,
      status: "ACTIVE"
    } as any)

    // Add to organization
    const org = await OrganizationModel.findById(invitation.organizationId)
    if (org) {
      org.members.push({
        userId: user._id,
        role: "MEMBER" as any,
        joinedAt: new Date()
      })
      await org.save()
    }

    // Remove invitation
    invitations.delete(token)

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
  const invitation = invitations.get(token)
  if (!invitation || invitation.expiresAt < new Date()) {
    return null
  }
  return invitation
}
