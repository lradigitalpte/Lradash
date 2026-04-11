import crypto from "crypto"

import { OAuth2Client } from "google-auth-library"
import jwt from "jsonwebtoken"
import { NextRequest } from "next/server"

import { requireOrganizationAccess } from "@/lib/auth/organization-access"
import { connectToDatabase } from "@/lib/db/connect"
import { decryptData, encryptData } from "@/lib/seo/encryption"
import { getAppUrl } from "@/lib/url/get-app-url"
import { GoogleWorkspaceAccountModel } from "@/models/google-workspace-account.model"

/** Required for Calendar + Meet event APIs (create/update/delete). */
export const GOOGLE_CALENDAR_EVENTS_SCOPE = "https://www.googleapis.com/auth/calendar.events"

export const GOOGLE_WORKSPACE_SCOPES = [
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  "https://www.googleapis.com/auth/userinfo.email"
]

export function hasGoogleCalendarEventsScope(scopes: string[] | undefined | null): boolean {
  if (!scopes?.length) {
    return false
  }

  return scopes.some(
    (s) => s === GOOGLE_CALENDAR_EVENTS_SCOPE || s.endsWith("/auth/calendar.events")
  )
}

const GOOGLE_STATE_SECRET =
  process.env.GOOGLE_OAUTH_STATE_SECRET ||
  process.env.ACCESS_TOKEN_SECRET ||
  "google-oauth-state-secret-change-me"

interface GoogleOAuthState {
  orgId: string
  userId: string
  projectId?: string
  returnTo?: string
}

interface GoogleAccountAccess {
  account: any
  accessToken: string
  refreshToken: string
}

interface CalendarMeetingAttendeeInput {
  email: string
  name?: string
}

interface CalendarMeetingRecurrenceInput {
  frequency: "DAILY" | "WEEKLY"
  interval?: number
  weekdays?: string[]
  until?: Date
}

interface CalendarMeetingInput {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  timezone: string
  attendees: CalendarMeetingAttendeeInput[]
  recurrence?: CalendarMeetingRecurrenceInput
}

type CalendarMeetingUpdateInput = Partial<CalendarMeetingInput>

function getGoogleOAuthRedirectUri(request?: NextRequest | Request | null) {
  return process.env.GOOGLE_REDIRECT_URI || `${getAppUrl(request)}/api/auth/google/callback`
}

function createGoogleOAuthClient(request?: NextRequest | Request | null) {
  const clientId = process.env.GOOGLE_CLIENT_ID || ""
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ""

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials are not configured")
  }

  return new OAuth2Client(clientId, clientSecret, getGoogleOAuthRedirectUri(request))
}

function createGoogleOAuthState(payload: GoogleOAuthState) {
  return jwt.sign(payload, GOOGLE_STATE_SECRET, { expiresIn: "10m", algorithm: "HS256" })
}

export function parseGoogleOAuthState(state: string) {
  return jwt.verify(state, GOOGLE_STATE_SECRET, { algorithms: ["HS256"] }) as GoogleOAuthState
}

function normalizeReturnTo(returnTo?: string | null) {
  if (!returnTo || !returnTo.startsWith("/")) {
    return "/en/settings?google=connected"
  }

  return returnTo
}

function isTokenExpired(tokenExpiresAt?: Date | null) {
  if (!tokenExpiresAt) {
    return false
  }

  return tokenExpiresAt.getTime() <= Date.now() + 60_000
}

async function revokeGoogleToken(token: string) {
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString()
  })
}

async function googleApiFetch<T>(
  accessToken: string,
  input: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers
    }
  })

  if (!response.ok) {
    let details = response.statusText

    try {
      const payload = await response.json()
      details = payload.error?.message || payload.error_description || details
    } catch {
      const text = await response.text()
      details = text || details
    }

    throw new Error(`Google API error (${response.status}): ${details}`)
  }

  return (await response.json()) as T
}

async function refreshGoogleAccountTokens(
  account: any,
  request?: NextRequest | Request | null
): Promise<GoogleAccountAccess> {
  const refreshToken = decryptData(account.refreshToken)
  const client = createGoogleOAuthClient(request)

  client.setCredentials({ refresh_token: refreshToken })

  const { credentials } = await client.refreshAccessToken()
  const nextAccessToken = credentials.access_token || decryptData(account.accessToken)
  const nextRefreshToken = credentials.refresh_token || refreshToken

  account.accessToken = encryptData(nextAccessToken)
  account.refreshToken = encryptData(nextRefreshToken)
  account.tokenExpiresAt = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : account.tokenExpiresAt
  account.lastRefreshedAt = new Date()
  await account.save()

  return {
    account,
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken
  }
}

export async function generateGoogleWorkspaceAuthUrl(
  payload: GoogleOAuthState,
  request?: NextRequest | Request | null
) {
  const client = createGoogleOAuthClient(request)
  const state = createGoogleOAuthState(payload)

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_WORKSPACE_SCOPES,
    state
  })
}

export async function exchangeGoogleCodeForTokens(
  code: string,
  request?: NextRequest | Request | null
) {
  const client = createGoogleOAuthClient(request)
  const { tokens } = await client.getToken(code)
  return tokens
}

export async function getGoogleProfile(accessToken: string) {
  return googleApiFetch<{ id: string; email: string }>(
    accessToken,
    "https://www.googleapis.com/oauth2/v2/userinfo",
    { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } }
  )
}

export async function getActiveGoogleWorkspaceAccount(
  access: Awaited<ReturnType<typeof requireOrganizationAccess>>,
  request?: NextRequest | Request | null
): Promise<GoogleAccountAccess> {
  if ("error" in access) {
    throw new Error("Organization access is required")
  }

  await connectToDatabase()

  const account = await GoogleWorkspaceAccountModel.findOne({
    organizationId: access.org._id,
    userId: access.user._id,
    isActive: true
  })

  if (!account) {
    throw new Error("Google Calendar is not connected for this organization user")
  }

  if (!account.accessToken || !account.refreshToken) {
    throw new Error("Stored Google credentials are incomplete")
  }

  const accessToken = decryptData(account.accessToken)
  const refreshToken = decryptData(account.refreshToken)

  if (isTokenExpired(account.tokenExpiresAt)) {
    return refreshGoogleAccountTokens(account, request)
  }

  return {
    account,
    accessToken,
    refreshToken
  }
}

export async function disconnectGoogleWorkspaceAccount(
  access: Awaited<ReturnType<typeof requireOrganizationAccess>>,
  request?: NextRequest | Request | null
) {
  if ("error" in access) {
    throw new Error("Organization access is required")
  }

  const { account, accessToken } = await getActiveGoogleWorkspaceAccount(access, request)

  try {
    await revokeGoogleToken(accessToken)
  } catch (error) {
    console.error("Google revoke token warning:", error)
  }

  account.isActive = false
  account.disconnectedAt = new Date()
  await account.save()
}

function buildCalendarEventPayload(input: CalendarMeetingInput | CalendarMeetingUpdateInput) {
  return {
    ...(input.title !== undefined ? { summary: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.startTime !== undefined
      ? {
          start: {
            dateTime: input.startTime.toISOString(),
            timeZone: input.timezone
          }
        }
      : {}),
    ...(input.endTime !== undefined
      ? {
          end: {
            dateTime: input.endTime.toISOString(),
            timeZone: input.timezone
          }
        }
      : {}),
    ...(input.attendees !== undefined
      ? {
          attendees: input.attendees.map((attendee) => ({
            email: attendee.email,
            displayName: attendee.name
          }))
        }
      : {})
  }
}

function buildGoogleRecurrenceRule(recurrence?: CalendarMeetingRecurrenceInput) {
  if (!recurrence) {
    return undefined
  }

  const parts = [`FREQ=${recurrence.frequency}`, `INTERVAL=${recurrence.interval || 1}`]

  if (recurrence.weekdays && recurrence.weekdays.length > 0) {
    parts.push(`BYDAY=${recurrence.weekdays.join(",")}`)
  }

  if (recurrence.until) {
    const untilUtc = recurrence.until.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    parts.push(`UNTIL=${untilUtc}`)
  }

  return [`RRULE:${parts.join(";")}`]
}

export async function createGoogleCalendarMeeting(
  accessToken: string,
  input: CalendarMeetingInput
) {
  const recurrence = buildGoogleRecurrenceRule(input.recurrence)

  return googleApiFetch<any>(
    accessToken,
    "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
    {
      method: "POST",
      body: JSON.stringify({
        ...buildCalendarEventPayload(input),
        ...(recurrence ? { recurrence } : {}),
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: {
              type: "hangoutsMeet"
            }
          }
        }
      })
    }
  )
}

export async function updateGoogleCalendarMeeting(
  accessToken: string,
  eventId: string,
  input: CalendarMeetingUpdateInput
) {
  return googleApiFetch<any>(
    accessToken,
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?conferenceDataVersion=1&sendUpdates=all`,
    {
      method: "PATCH",
      body: JSON.stringify(buildCalendarEventPayload(input))
    }
  )
}

export async function deleteGoogleCalendarMeeting(accessToken: string, eventId: string) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  )

  if (!response.ok && response.status !== 404) {
    let details = response.statusText

    try {
      const payload = await response.json()
      details = payload.error?.message || details
    } catch {
      const text = await response.text()
      details = text || details
    }

    throw new Error(`Google API error (${response.status}): ${details}`)
  }
}

export function extractMeetDetails(event: any) {
  const meetUri =
    event?.conferenceData?.entryPoints?.find((entry: any) => entry.entryPointType === "video")
      ?.uri || ""
  const match = meetUri.match(/\/([a-z]{3}-[a-z]{4}-[a-z]{3})$/i)

  return {
    meetUri,
    meetCode: match?.[1] || ""
  }
}

export async function upsertGoogleWorkspaceAccount(params: {
  organizationId: string
  userId: string
  accessToken: string
  refreshToken: string
  tokenExpiresAt?: number | null
  scopes?: string[]
  email?: string
  googleUserId?: string
}) {
  await connectToDatabase()

  const update = {
    accessToken: encryptData(params.accessToken),
    refreshToken: encryptData(params.refreshToken),
    tokenExpiresAt: params.tokenExpiresAt ? new Date(params.tokenExpiresAt) : null,
    scopes: params.scopes || [],
    email: params.email,
    googleUserId: params.googleUserId,
    isActive: true,
    disconnectedAt: null
  }

  return GoogleWorkspaceAccountModel.findOneAndUpdate(
    {
      organizationId: params.organizationId,
      userId: params.userId
    },
    { $set: update },
    { upsert: true, new: true }
  )
}

export function buildGoogleCallbackRedirectUrl(
  request: NextRequest,
  returnTo: string | undefined,
  status: "success" | "error",
  message?: string
) {
  const appUrl = getAppUrl(request)
  const baseUrl = new URL(normalizeReturnTo(returnTo), appUrl)

  baseUrl.searchParams.set("google", status)

  if (message) {
    baseUrl.searchParams.set(status === "error" ? "error" : "message", message)
  }

  return baseUrl.toString()
}

export { GOOGLE_WORKSPACE_SCOPES, normalizeReturnTo }
