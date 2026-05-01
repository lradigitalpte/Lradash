import { NextRequest, NextResponse } from "next/server"

import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UserModel } from "@/models/user.model"

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const user = await UserModel.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.passwordHash) {
      const validCurrent = await verifyPassword(currentPassword, user.passwordHash)
      if (!validCurrent) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
    } else if (!currentPassword) {
      // For OAuth-first accounts, allow setting a first password without current password.
    }

    user.passwordHash = await hashPassword(newPassword)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 })
  }
}
