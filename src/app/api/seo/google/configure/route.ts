import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { encryptData } from "@/lib/seo/encryption"
import { GoogleConnectionModel } from "@/models/google-connection.model"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { projectId, clientId, clientSecret } = body

    if (!projectId || !clientId || !clientSecret) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, clientId, clientSecret" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    await connectToDatabase()

    // Encrypt credentials before storing
    const encryptedClientId = encryptData(clientId)
    const encryptedClientSecret = encryptData(clientSecret)

    // Store credentials with encryption
    const googleConfig = await GoogleConnectionModel.findOneAndUpdate(
      { projectId },
      {
        projectId,
        clientId: encryptedClientId,
        clientSecret: encryptedClientSecret,
        isActive: true,
        configuredAt: new Date()
      },
      { upsert: true, new: true }
    )

    return NextResponse.json(
      {
        success: true,
        message: "Google OAuth credentials saved successfully",
        configured: true
      },
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Save Google configuration error:", error)
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
