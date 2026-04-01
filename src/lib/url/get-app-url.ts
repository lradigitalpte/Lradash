import { NextRequest } from "next/server"

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}

export function getAppUrl(request?: NextRequest | Request | null): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL

  if (configured) {
    const normalized = configured.startsWith("http") ? configured : `https://${configured}`
    return trimTrailingSlash(normalized)
  }

  const hostFromEnv = process.env.VERCEL_URL
  if (hostFromEnv) {
    return trimTrailingSlash(`https://${hostFromEnv}`)
  }

  if (request) {
    const headers = request.headers
    const protocol = headers.get("x-forwarded-proto") || "https"
    const host = headers.get("x-forwarded-host") || headers.get("host")
    if (host) {
      return trimTrailingSlash(`${protocol}://${host}`)
    }

    if ("url" in request && request.url) {
      return trimTrailingSlash(new URL(request.url).origin)
    }
  }

  return "http://localhost:3000"
}
