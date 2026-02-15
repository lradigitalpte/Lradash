import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { ProjectModel } from "@/models/project.model"
import { UserModel } from "@/models/user.model"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
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

    let organizationId = decoded.organizationId
    // Fallback for organizationId if missing in token
    if (!organizationId) {
      const user = await UserModel.findById(decoded.userId).lean()
      if (user && user.defaultOrganizationId) {
        organizationId = user.defaultOrganizationId.toString()
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 401 })
    }

    const body = await request.json()
    const { email, userId: targetUserId } = body
    const { projectId } = await params

    if (!email && !targetUserId) {
      return NextResponse.json({ error: "Email or User ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    let userToAdd

    if (targetUserId) {
      userToAdd = await UserModel.findOne({
        _id: targetUserId
        // Ensure user is in the same organization if your app supports multi-org users,
        // OR if users are global but projects are org-scoped, you might just check existence.
        // Assuming users are global or linked to orgs via members collection, strictly checking org might be tricky if not stored on user.
        // However, for safety, let's assume we can add any user for now, or check if they are "findable".
      })
    } else {
      userToAdd = await UserModel.findOne({ email })
    }

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const project = await ProjectModel.findOne({
      _id: projectId,
      organizationId,
      deletedAt: null
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check if user is already a member
    const isMember = project.members.some((m: any) => m.toString() === userToAdd._id.toString())
    if (isMember) {
      return NextResponse.json({ error: "User is already a member" }, { status: 400 })
    }

    // Add user to members
    ;(project.members as any).push(userToAdd._id)
    await project.save()

    return NextResponse.json({ success: true, message: "Member added successfully" })
  } catch (error: any) {
    console.error("Add member error:", error)
    return NextResponse.json({ error: error.message || "Failed to add member" }, { status: 500 })
  }
}
