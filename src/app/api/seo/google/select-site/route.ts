import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { GoogleConnectionModel } from "@/models/google-connection.model"

/**
 * Save selected website for SEO monitoring
 */
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
    const { projectId, websiteUrl } = body

    if (!projectId || !websiteUrl) {
      return NextResponse.json({ error: "Missing projectId or websiteUrl" }, { status: 400 })
    }

    await connectToDatabase()

    // Update connection with selected website
    const isDomain = websiteUrl.includes("sc-domain:")
    const propertyType = isDomain ? "domain" : "url-prefix"

    const connection = await GoogleConnectionModel.findOneAndUpdate(
      { projectId },
      {
        propertyUrl: websiteUrl,
        propertyType,
        isActive: true
      },
      { new: true }
    )

    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 })
    }

    console.log(`[Select Site] Website selected for projectId: ${projectId}`)
    console.log(`[Select Site] Selected: ${websiteUrl}`)
    console.log(`[Select Site] Connection activated: ✓`)

    return NextResponse.json(
      {
        success: true,
        message: "Website selected successfully",
        propertyUrl: connection.propertyUrl
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Select site error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to select site" },
      { status: 500 }
    )
  }
}
