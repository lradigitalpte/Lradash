import { NextRequest, NextResponse } from "next/server"
import { loginUser } from "@/lib/auth/auth-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const result = await loginUser({ email, password })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401, headers: { "Content-Type": "application/json" } }
      )
    }

    // Set refresh token in httpOnly cookie
    const response = NextResponse.json(
      {
        accessToken: result.accessToken,
        user: result.user
      },
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )

    response.cookies.set("refreshToken", result.refreshToken || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
