import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { UserModel } from "@/models/user.model"

export async function GET(req: NextRequest) {
  try {
    // Verify Bearer token from API client
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ User search: Missing or invalid authorization header")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded || (!decoded.userId && !decoded.email)) {
      console.error("❌ User search: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    await connectToDatabase()
    const searchParams = req.nextUrl.searchParams
    const username = searchParams.get("username") || ""

    console.log(
      `🔍 User search: query="${username}" by ${decoded.email ?? decoded.userId ?? "unknown"}`
    )

    let query = {}
    if (username && username.trim()) {
      query = {
        $or: [
          { name: { $regex: username, $options: "i" } },
          { email: { $regex: username, $options: "i" } }
        ]
      }
    }

    const users = await UserModel.find(query).select("_id email name avatar").limit(10)

    console.log(`✅ User search: found ${users.length} users`)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("❌ Error searching users:", error)
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 })
  }
}
