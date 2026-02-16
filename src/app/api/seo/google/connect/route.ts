import { OAuth2Client } from "google-auth-library"
import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { GoogleConnectionModel } from "@/models/google-connection.model"

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

    // Get projectId from query parameters
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Check if already connected
    const existingConnection = await GoogleConnectionModel.findOne({
      projectId,
      isActive: true
    })

    if (existingConnection) {
      return NextResponse.json(
        {
          connected: true,
          propertyUrl: existingConnection.propertyUrl,
          lastSyncedAt: existingConnection.lastSyncedAt
        },
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Generate auth URL for new connection
    // Use stored credentials if available, otherwise use environment variables
    let clientId = process.env.GOOGLE_CLIENT_ID || ""
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""

    // Check for stored credentials in database
    const config = await GoogleConnectionModel.findOne({ projectId })
    if (config?.clientId && config?.clientSecret) {
      clientId = config.clientId
      clientSecret = config.clientSecret
    }

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          error:
            "Google OAuth credentials not configured. Please configure them in the SEO settings.",
          configured: false,
          connected: false
        },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create OAuth client and generate auth URL
    const oauth2Client = new OAuth2Client(
      clientId,
      clientSecret,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/seo/google/callback`
    )

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/webmasters.readonly"],
      state: projectId,
      prompt: "consent"
    })

    return NextResponse.json(
      {
        connected: false,
        authUrl,
        configured: true
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Get Google connection status error:", error)
    return NextResponse.json(
      { error: "Failed to check connection status", details: String(error) },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
