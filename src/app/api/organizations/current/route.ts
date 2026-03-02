import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

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

    // Get user's default organization
    const user = await UserModel.findById(decoded.userId)
    if (!user?.defaultOrganizationId) {
      return NextResponse.json(
        { error: "No organization set" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get organization with members
    const org = await OrganizationModel.findById(user.defaultOrganizationId)
      .populate("members.userId", "name email avatar")
      .lean()

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        members: org.members.map((m: any) => ({
          _id: m._id.toString(),
          userId: m.userId._id.toString(),
          userName: m.userId.name,
          userEmail: m.userId.email,
          userAvatar: m.userId.avatar || undefined,
          role: m.role,
          joinedAt: m.joinedAt
        }))
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Get organization error:", error)
    return NextResponse.json(
      { error: "Failed to fetch organization" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
