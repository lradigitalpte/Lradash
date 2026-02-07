import { NextRequest, NextResponse } from "next/server"
import { inviteUserToOrganization } from "@/lib/db/invitation"
import { verifyAccessToken } from "@/lib/auth/tokens"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: organizationId } = await params
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
    const { email, role = "MEMBER" } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const result = await inviteUserToOrganization(
      organizationId,
      email,
      decoded.userId,
      role
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      { success: true, token: result.token },
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Invite error:", error)
    return NextResponse.json(
      { error: "Failed to send invitation" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
