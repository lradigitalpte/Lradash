import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UserModel } from "@/models/user.model"

function serializeProfile(user: any) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    notificationEmail: user.notificationEmail ?? "",
    preferences: user.preferences,
    status: user.status
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const body = await request.json()
    const { name, avatar, preferences, email, notificationEmail } = body

    // Validate input
    if (name && typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid name format" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (avatar && typeof avatar !== "string") {
      return NextResponse.json(
        { error: "Invalid avatar format" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (email && typeof email !== "string") {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (notificationEmail !== undefined && typeof notificationEmail !== "string") {
      return NextResponse.json(
        { error: "Invalid notification email format" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()
    const user = await UserModel.findById(decoded.userId)

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    // Update allowed fields
    if (name) {
      user.name = name
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase()
      const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
      if (!emailLooksValid) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }

      if (normalizedEmail !== user.email) {
        const existing = await UserModel.findOne({
          email: normalizedEmail,
          _id: { $ne: user._id }
        }).lean()

        if (existing) {
          return NextResponse.json(
            { error: "Email already in use" },
            { status: 409, headers: { "Content-Type": "application/json" } }
          )
        }

        user.email = normalizedEmail
        ;(user as any).emailVerified = undefined
        ;(user as any).emailVerificationToken = undefined
      }
    }

    if (avatar) {
      user.avatar = avatar
    }

    if (preferences) {
      if (!user.preferences) {
        user.preferences = {
          theme: "light",
          language: "en",
          emailNotifications: true
        }
      }
      if (preferences.theme) {
        user.preferences.theme = preferences.theme
      }
      if (preferences.language) {
        user.preferences.language = preferences.language
      }
      if (typeof preferences.emailNotifications === "boolean") {
        user.preferences.emailNotifications = preferences.emailNotifications
      }
    }

    // Update notification email (empty string = clear / use account email)
    if (notificationEmail !== undefined) {
      const trimmed = notificationEmail.trim().toLowerCase()
      if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return NextResponse.json(
          { error: "Invalid notification email address" },
          { status: 400, headers: { "Content-Type": "application/json" } }
        )
      }
      // Force field to be marked as modified
      user.set("notificationEmail", trimmed)
      user.markModified("notificationEmail")
    }

    try {
      await user.save()
    } catch (err: any) {
      // Handle unique constraint errors gracefully
      if (err?.code === 11000) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409, headers: { "Content-Type": "application/json" } }
        )
      }
      throw err
    }

    const savedUser = await UserModel.findById(decoded.userId).select("-passwordHash").lean()

    if (!savedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(serializeProfile(savedUser), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()
    const user = await UserModel.findById(decoded.userId).select("-passwordHash").lean()

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(serializeProfile(user), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
