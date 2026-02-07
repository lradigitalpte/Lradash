import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { createOrganization } from "@/lib/db/organization"

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await auth.api.getSession({
      headers: request.headers
    })

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create organization
    const organization = await createOrganization({
      name: name,
      slug: slug,
      owner: session.user.id
    })

    return NextResponse.json(organization, {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    console.error("Create organization error:", error)
    const message = error instanceof Error ? error.message : "Failed to create organization"
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
