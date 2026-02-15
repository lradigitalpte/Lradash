"use server"

import type { TokenPayload } from "./tokens"

import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { RefreshTokenModel } from "@/models/refreshToken.model"
import { UserModel } from "@/models/user.model"

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
  }
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
      organizationId: orgId
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
        name: userName
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

    const tokenPayload: TokenPayload = {
      userId: userId,
      email: userEmail,
      organizationId: orgId
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
        name: userName
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
    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      organizationId: orgId
    }

    const newAccessToken = generateAccessToken(tokenPayload)

    return {
      success: true,
      accessToken: newAccessToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
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
