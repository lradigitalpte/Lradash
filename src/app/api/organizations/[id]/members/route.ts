import { NextRequest, NextResponse } from "next/server"

import { hashPassword } from "@/lib/auth/password"
import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"
import { UserRole } from "@/types/dbInterface"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: organizationId } = await params
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
        { error: "You do not have permission to add members" },
        { status: 403 }
      )
    }

    // 2. Parse body
    const { email, password, name, role: requestedRole = "MEMBER" } = await request.json()

    const normalizedRole = String(requestedRole ?? "MEMBER").toUpperCase()
    const allowedRoles = new Set<UserRole>([
      UserRole.MEMBER,
      UserRole.ADMIN,
      UserRole.OWNER,
      UserRole.CLIENT
    ])
    const safeRole = allowedRoles.has(normalizedRole as UserRole)
      ? (normalizedRole as UserRole)
      : UserRole.MEMBER

    // Only OWNER can grant elevated org roles.
    const requesterIsOwner = requesterMember.role === "OWNER"
    const finalRole: UserRole = requesterIsOwner
      ? safeRole
      : safeRole === UserRole.ADMIN || safeRole === UserRole.OWNER
        ? UserRole.MEMBER
        : safeRole

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 })
    }

    // 3. Check if user already exists
    let user = await UserModel.findOne({ email: email.toLowerCase() })
    if (user) {
      // If user exists, check if they are already in the organization
      const isAlreadyMember = org.members.some(
        (m: any) => m.userId.toString() === user!._id.toString()
      )

      if (isAlreadyMember) {
        return NextResponse.json(
          { error: "User is already a member of this organization" },
          { status: 400 }
        )
      }
    } else {
      // Create new user
      const passwordHash = await hashPassword(password)
      user = await UserModel.create({
        email: email.toLowerCase(),
        name,
        passwordHash,
        status: "ACTIVE",
        defaultOrganizationId: organizationId
      } as any)
    }

    // 4. Add user to organization
    org.members.push({
      userId: user._id,
      role: finalRole,
      joinedAt: new Date()
    })

    await org.save()

    return NextResponse.json(
      { success: true, message: "Member created and added successfully" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Create member error:", error)
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 })
  }
}
