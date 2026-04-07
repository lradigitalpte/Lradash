import { NextRequest, NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/db/connect"
import { acceptInvitation, getInvitation } from "@/lib/db/invitation"
import { OrganizationModel } from "@/models/organization.model"
import { UserModel } from "@/models/user.model"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const invitation = await getInvitation(token)

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    await connectToDatabase()

    const [organization, existingUser] = await Promise.all([
      OrganizationModel.findById(invitation.organizationId).select("name slug").lean(),
      UserModel.findOne({ email: invitation.email }).select("_id").lean()
    ])

    return NextResponse.json({
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      organization: organization
        ? {
            id: organization._id.toString(),
            name: organization.name,
            slug: organization.slug
          }
        : null,
      existingUser: Boolean(existingUser)
    })
  } catch (error) {
    console.error("Get invitation details error:", error)
    return NextResponse.json({ error: "Failed to fetch invitation" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json().catch(() => ({}))
    const name = typeof body.name === "string" ? body.name : ""
    const password = typeof body.password === "string" ? body.password : ""

    const result = await acceptInvitation(token, name, password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (error) {
    console.error("Accept invitation route error:", error)
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 })
  }
}
