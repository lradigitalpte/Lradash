import { NextRequest, NextResponse } from "next/server"
import { refreshAccessToken } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token not found" },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    const result = await refreshAccessToken(refreshToken)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    return NextResponse.json(
      {
        accessToken: result.accessToken,
        user: result.user
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
