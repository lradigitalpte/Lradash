import { NextRequest, NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/db/connect"
import {
  buildGoogleCallbackRedirectUrl,
  exchangeGoogleCodeForTokens,
  getGoogleProfile,
  parseGoogleOAuthState,
  upsertGoogleWorkspaceAccount
} from "@/lib/google/workspace"
import { decryptData } from "@/lib/seo/encryption"
import { GoogleWorkspaceAccountModel } from "@/models/google-workspace-account.model"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  let parsedState:
    | {
        orgId: string
        userId: string
        projectId?: string
        returnTo?: string
      }
    | undefined

  try {
    if (!state) {
      return NextResponse.redirect(
        buildGoogleCallbackRedirectUrl(request, undefined, "error", "Missing OAuth state")
      )
    }

    parsedState = parseGoogleOAuthState(state)

    if (error) {
      return NextResponse.redirect(
        buildGoogleCallbackRedirectUrl(request, parsedState.returnTo, "error", error)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        buildGoogleCallbackRedirectUrl(request, parsedState.returnTo, "error", "Missing auth code")
      )
    }

    const tokens = await exchangeGoogleCodeForTokens(code, request)
    await connectToDatabase()

    const existingAccount = await GoogleWorkspaceAccountModel.findOne({
      organizationId: parsedState.orgId,
      userId: parsedState.userId
    }).lean()

    const accessToken = tokens.access_token
    const refreshToken = tokens.refresh_token || decryptData(existingAccount?.refreshToken || "")

    if (!accessToken || !refreshToken) {
      throw new Error("Google OAuth did not return a usable access/refresh token pair")
    }

    const profile = await getGoogleProfile(accessToken)

    await upsertGoogleWorkspaceAccount({
      organizationId: parsedState.orgId,
      userId: parsedState.userId,
      accessToken,
      refreshToken,
      tokenExpiresAt: tokens.expiry_date,
      scopes: tokens.scope?.split(" ") || existingAccount?.scopes || [],
      email: profile.email,
      googleUserId: profile.id
    })

    return NextResponse.redirect(
      buildGoogleCallbackRedirectUrl(request, parsedState.returnTo, "success", "connected")
    )
  } catch (oauthError) {
    console.error("Google auth callback error:", oauthError)

    return NextResponse.redirect(
      buildGoogleCallbackRedirectUrl(
        request,
        parsedState?.returnTo,
        "error",
        oauthError instanceof Error ? oauthError.message : "Failed to connect Google"
      )
    )
  }
}
