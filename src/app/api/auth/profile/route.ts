import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UserModel } from "@/models/user.model"

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
    const { name, avatar, preferences } = body

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

    await user.save()

    return NextResponse.json(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
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

    return NextResponse.json(
      {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        preferences: user.preferences,
        status: user.status
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get profile error:", error)
    return NextResponse.json(
      { error: "Failed to get profile" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
