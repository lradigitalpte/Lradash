import { NextRequest, NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow auth API routes and monitor cron to pass through
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/monitor/cron")) {
    return NextResponse.next()
  }

  // Allow public assets/images with extensions
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    return NextResponse.next()
  }

  // Check for custom auth refresh token cookie
  const refreshToken = req.cookies.get("refreshToken")
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization")

  // App-router server-side fetch often doesn't have the cookie passed explicitly
  // but if the user has a refreshToken, they are authenticated.
  const isAuthenticated =
    !!refreshToken?.value || (!!authHeader && authHeader.startsWith("Bearer "))

  // Protect API routes (except auth)
  if (pathname.startsWith("/api")) {
    if (!isAuthenticated) {
      console.warn(`Proxy 401: Path ${pathname} missing auth. Host: ${req.headers.get("host")}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Allow access to login/signup/home pages
  if (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/" ||
    pathname.startsWith("/en/login") ||
    pathname.startsWith("/en/signup")
  ) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users to login for protected routes
  if (!isAuthenticated) {
    const protectedPaths = [
      "/boards",
      "/dashboard",
      "/projects",
      "/tasks",
      "/team",
      "/calendar",
      "/reports",
      "/en/boards",
      "/en/dashboard"
    ]
    if (protectedPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/en/login", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
}
