import { NextRequest, NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/db/connect"
import { encryptData } from "@/lib/seo/encryption"
import { exchangeCodeForTokens } from "@/lib/seo/google-search-console"
import { GoogleConnectionModel } from "@/models/google-connection.model"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state") // This contains the projectId
    const error = searchParams.get("error")

    // Extract locale from referrer or default to 'en'
    const referrer = request.headers.get("referer") || ""
    const localeMatch = referrer.match(/\/([a-z]{2})\//)
    const locale = localeMatch ? localeMatch[1] : "en"

    // Handle error from Google OAuth
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/projects/${state}/marketing/seo?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/projects/${state}/marketing/seo?error=missing_code`
      )
    }

    if (!state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${locale}?error=missing_state`
      )
    }

    const projectId = state

    // Exchange authorization code for tokens using stored credentials if available
    const tokens = await exchangeCodeForTokens(code, projectId)

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Failed to obtain access and refresh tokens")
    }

    // IMPORTANT: Encrypt tokens before storing in database
    const encryptedAccessToken = encryptData(tokens.access_token)
    const encryptedRefreshToken = encryptData(tokens.refresh_token)

    // IMPORTANT: Update the existing connection record with encrypted tokens FIRST
    const connection = await GoogleConnectionModel.findOneAndUpdate(
      { projectId },
      {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        // IMPORTANT: Keep isActive false until user selects a website
        isActive: false,
        propertyUrl: null
      },
      { new: true }
    )

    if (!connection) {
      throw new Error("Google connection record not found. Please configure credentials first.")
    }

    console.log(`[OAuth Callback] Tokens received for projectId: ${projectId}`)
    console.log(`[OAuth Callback] Access token saved: ${tokens.access_token ? "✓" : "✗"}`)
    console.log(`[OAuth Callback] Refresh token saved: ${tokens.refresh_token ? "✓" : "✗"}`)

    // Redirect to site selection page with proper locale prefix
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/projects/${projectId}/marketing/seo/select-site`
    )
  } catch (error) {
    console.error("Google OAuth callback error:", error)

    // Extract locale from referrer
    const referrer = request.headers.get("referer") || ""
    const localeMatch = referrer.match(/\/([a-z]{2})\//)
    const locale = localeMatch ? localeMatch[1] : "en"

    // Redirect with error message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${locale}?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Failed to connect Google Search Console"
      )}`
    )
  }
}
