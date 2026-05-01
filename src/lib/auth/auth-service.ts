"use server"

import crypto from "crypto"

import type { TokenPayload } from "./tokens"

import { connectToDatabase } from "@/lib/db/connect"
import { sendUserEmail } from "@/lib/email/send-user-email"
import { getAppUrl } from "@/lib/url/get-app-url"
import { OrganizationModel } from "@/models/organization.model"
import { RefreshTokenModel } from "@/models/refreshToken.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

import { hashPassword, verifyPassword } from "./password"
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "./tokens"

export interface SignUpData {
  email: string
  password: string
  name: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  accessToken?: string
  refreshToken?: string
  user?: {
    id: string
    email: string
    name: string
    orgRole?: UserRole
    isClient?: boolean
  }
}

async function resolveOrganizationRole(userId: string, organizationId: string): Promise<UserRole> {
  const org = await OrganizationModel.findById(organizationId).select("owner members").lean()

  if (!org) {
    return UserRole.MEMBER
  }

  if (org.owner.toString() === userId) {
    return UserRole.OWNER
  }

  const member = (org.members as any[]).find((entry) => entry.userId.toString() === userId)
  return (member?.role as UserRole) ?? UserRole.MEMBER
}

/**
 * Register a new user
 */
export async function registerUser(data: SignUpData): Promise<AuthResponse> {
  try {
    await connectToDatabase()

    const { email, password, name } = data

    // Check if user exists (use lean() to get plain object)
    const existingUser = await UserModel.findOne({ email: email.toLowerCase() }).lean()
    if (existingUser) {
      return { success: false, error: "Email already registered" }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await UserModel.create({
      email: email.toLowerCase(),
      name,
      passwordHash,
      status: "ACTIVE"
    } as any)

    // Serialize user ID immediately and convert to plain object
    const userId = user._id.toString()
    const userEmail = user.email
    const userName = user.name

    // Auto-create a default organization for the user
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${userId.slice(-6)}`
    const org = await OrganizationModel.create({
      name: `${name}'s Workspace`,
      slug,
      owner: user._id,
      members: [{ userId: user._id, role: "OWNER" }]
    })

    // Set the default organization on the user
    await UserModel.findByIdAndUpdate(user._id, {
      defaultOrganizationId: org._id
    })

    const orgId = org._id.toString()

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: userId,
      email: userEmail,
      organizationId: orgId,
      role: UserRole.OWNER
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshTokenString = generateRefreshToken(tokenPayload)

    // Store refresh token in DB
    await RefreshTokenModel.create({
      userId: user._id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    return {
      success: true,
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        orgRole: UserRole.OWNER,
        isClient: false
      }
    }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "Registration failed" }
  }
}

/**
 * Login user with email and password
 */
export async function loginUser(data: SignInData): Promise<AuthResponse> {
  try {
    await connectToDatabase()

    const { email, password } = data

    // Find user (use lean() to get plain object)
    const user = (await UserModel.findOne({ email: email.toLowerCase() }).lean()) as any
    if (!user) {
      return { success: false, error: "Invalid email or password" }
    }

    if (user.status !== "ACTIVE") {
      return { success: false, error: "Account is inactive. Contact your organization owner." }
    }

    // Verify password
    if (!user.passwordHash) {
      return { success: false, error: "Invalid email or password" }
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Generate tokens - ensure all values are primitives
    const userId = user._id.toString()
    const userEmail = user.email
    const userName = user.name

    // Ensure user has a default organization (multi-tenant)
    let orgId = user.defaultOrganizationId?.toString()
    if (!orgId) {
      const slug = `${userName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${userId.slice(-6)}`
      const org = await OrganizationModel.create({
        name: `${userName}'s Workspace`,
        slug,
        owner: user._id,
        members: [{ userId: user._id, role: "OWNER" }]
      })
      await UserModel.findByIdAndUpdate(user._id, {
        defaultOrganizationId: org._id
      })
      orgId = org._id.toString()
    }

    const orgRole = await resolveOrganizationRole(userId, orgId)

    const tokenPayload: TokenPayload = {
      userId: userId,
      email: userEmail,
      organizationId: orgId,
      role: orgRole
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshTokenString = generateRefreshToken(tokenPayload)

    // Store refresh token in DB
    await RefreshTokenModel.create({
      userId: user._id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    return {
      success: true,
      accessToken,
      refreshToken: refreshTokenString,
      user: {
        id: userId,
        email: userEmail,
        name: userName,
        orgRole,
        isClient: orgRole === UserRole.CLIENT
      }
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Login failed" }
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  try {
    await connectToDatabase()

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)
    if (!decoded) {
      return { success: false, error: "Invalid refresh token" }
    }

    // Check if token is revoked
    const tokenRecord = await RefreshTokenModel.findOne({
      token: refreshToken,
      revokedAt: null
    })

    if (!tokenRecord) {
      return { success: false, error: "Refresh token not found or revoked" }
    }

    // Get user (use lean() to get plain object)
    const user = await UserModel.findById(decoded.userId).lean()
    if (!user) {
      return { success: false, error: "User not found" }
    }

    if ((user as any).status !== "ACTIVE") {
      await RefreshTokenModel.updateOne({ token: refreshToken }, { revokedAt: new Date() })
      return { success: false, error: "Account is inactive" }
    }

    // Ensure user has a default organization (multi-tenant)
    let orgId = user.defaultOrganizationId?.toString()
    if (!orgId) {
      const slug = `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${user._id.toString().slice(-6)}`
      const org = await OrganizationModel.create({
        name: `${user.name}'s Workspace`,
        slug,
        owner: user._id,
        members: [{ userId: user._id, role: "OWNER" }]
      })
      await UserModel.findByIdAndUpdate(user._id, {
        defaultOrganizationId: org._id
      })
      orgId = org._id.toString()
    }

    // Generate new access token
    const orgRole = await resolveOrganizationRole(user._id.toString(), orgId)

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      organizationId: orgId,
      role: orgRole
    }

    const newAccessToken = generateAccessToken(tokenPayload)

    return {
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        orgRole,
        isClient: orgRole === UserRole.CLIENT
      }
    }
  } catch (error) {
    console.error("Token refresh error:", error)
    return { success: false, error: "Token refresh failed" }
  }
}

/**
 * Logout user by revoking refresh token
 */
export async function logoutUser(
  refreshToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase()

    await RefreshTokenModel.updateOne({ token: refreshToken }, { revokedAt: new Date() })

    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, error: "Logout failed" }
  }
}

export async function requestPasswordReset(
  email: string,
  appUrlOverride?: string
): Promise<{ success: boolean }> {
  try {
    await connectToDatabase()

    const normalizedEmail = email.trim().toLowerCase()
    const user = await UserModel.findOne({ email: normalizedEmail })

    if (!user) {
      return { success: true }
    }

    const rawToken = crypto.randomBytes(32).toString("hex")
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    user.passwordResetToken = hashedToken
    user.passwordResetExpires = expiresAt
    await user.save()

    const appUrl = appUrlOverride || getAppUrl()
    const resetUrl = `${appUrl}/en/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`

    await sendUserEmail({
      to: normalizedEmail,
      type: "password_reset",
      recipientName: user.name || normalizedEmail,
      subjectEntity: "Reset your password",
      bodyText:
        "We received a request to reset your password. Use the link below to set a new password.",
      actionUrl: resetUrl,
      actionLabel: "Reset Password"
    })

    return { success: true }
  } catch (error) {
    console.error("Request password reset error:", error)
    return { success: true }
  }
}

export async function resetPassword(input: {
  email: string
  token: string
  password: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await connectToDatabase()

    const normalizedEmail = input.email.trim().toLowerCase()
    const hashedToken = crypto.createHash("sha256").update(input.token).digest("hex")

    const user = await UserModel.findOne({
      email: normalizedEmail,
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    })

    if (!user) {
      return { success: false, error: "Reset link is invalid or has expired" }
    }

    user.passwordHash = await hashPassword(input.password)
    user.passwordResetToken = undefined as any
    user.passwordResetExpires = undefined as any
    await user.save()

    await RefreshTokenModel.updateMany({ userId: user._id }, { revokedAt: new Date() })

    return { success: true }
  } catch (error) {
    console.error("Reset password error:", error)
    return { success: false, error: "Failed to reset password" }
  }
}
