import { NextRequest, NextResponse } from "next/server"
import { logoutUser } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (refreshToken) {
      await logoutUser(refreshToken)
    }

    const response = NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )

    // Clear refresh token cookie
    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
