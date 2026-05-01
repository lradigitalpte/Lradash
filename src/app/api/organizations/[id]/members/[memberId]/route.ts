import { NextRequest, NextResponse } from "next/server"

import { hashPassword } from "@/lib/auth/password"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { RefreshTokenModel } from "@/models/refreshToken.model"
import { UserModel } from "@/models/user.model"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: organizationId, memberId } = await params
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
    const password = typeof body.password === "string" ? body.password : ""
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    await connectToDatabase()
    const org = await OrganizationModel.findById(organizationId)
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const requesterMember = org.members.find((m: any) => m.userId.toString() === decoded.userId)
    if (
      !requesterMember ||
      (requesterMember.role !== "OWNER" && requesterMember.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "You do not have permission to change member passwords" },
        { status: 403 }
      )
    }

    const targetMember = org.members.find(
      (m: any) => m._id.toString() === memberId || m.userId.toString() === memberId
    )
    if (!targetMember) {
      return NextResponse.json({ error: "Member not found in organization" }, { status: 404 })
    }

    // Owners/Admins can reset any non-owner member password.

    if (targetMember.role === "OWNER") {
      return NextResponse.json(
        { error: "Owner passwords must be changed by the owner account directly" },
        { status: 400 }
      )
    }

    const user = await UserModel.findById(targetMember.userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    user.passwordHash = await hashPassword(password)
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    return NextResponse.json(
      { success: true, message: "Member password updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update member password error:", error)
    return NextResponse.json({ error: "Failed to update member password" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: organizationId, memberId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()

    // 1. Check if the requester has permission (OWNER or ADMIN)
    const org = await OrganizationModel.findById(organizationId)
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const requesterMember = org.members.find((m: any) => m.userId.toString() === decoded.userId)

    if (
      !requesterMember ||
      (requesterMember.role !== "OWNER" && requesterMember.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "You do not have permission to remove members" },
        { status: 403 }
      )
    }

    // 2. Find the member to remove
    const memberIndex = org.members.findIndex(
      (m: any) => m._id.toString() === memberId || m.userId.toString() === memberId
    )

    if (memberIndex === -1) {
      return NextResponse.json({ error: "Member not found in organization" }, { status: 404 })
    }

    // 3. Check if we are trying to remove the owner
    const targetMember = org.members[memberIndex]
    if (targetMember.role === "OWNER") {
      return NextResponse.json(
        { error: "The owner cannot be removed from the organization" },
        { status: 400 }
      )
    }

    // 4. Check if trying to remove self (unless owner removing self, but we handled OWNER above)
    // Actually, users can leave, but "remove member" implies an admin action.

    // 5. Remove the member from organization
    org.members.splice(memberIndex, 1)
    await org.save()

    // 6. Disable account login + revoke all refresh sessions
    await UserModel.findByIdAndUpdate(targetMember.userId, { status: "INACTIVE" })
    await RefreshTokenModel.updateMany({ userId: targetMember.userId }, { revokedAt: new Date() })

    return NextResponse.json(
      { success: true, message: "Member removed and access revoked successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
