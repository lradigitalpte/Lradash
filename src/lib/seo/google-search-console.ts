import { OAuth2Client } from "google-auth-library"

import { connectToDatabase } from "@/lib/db/connect"
import { decryptData, encryptData } from "@/lib/seo/encryption"
import { GoogleConnectionModel } from "@/models/google-connection.model"

// Google Search Console API configuration
const GSC_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri:
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/seo/google/callback`,
  scopes: ["https://www.googleapis.com/auth/webmasters.readonly"]
}

export interface SearchAnalyticsParams {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions?: string[]
  type?: string
  rowLimit?: number
  searchType?: string
}

export interface SearchAnalyticsResponse {
  rows?: Array<{
    keys: string[]
    clicks: number
    impressions: number
    ctr: number
    position: number
  }>
}

/**
 * Create OAuth2 client for Google authentication
 * Can use stored credentials from database if projectId is provided
 */
export async function createOAuth2Client(projectId?: string) {
  let clientId = GSC_CONFIG.clientId
  let clientSecret = GSC_CONFIG.clientSecret

  // If projectId provided, try to use stored credentials
  if (projectId) {
    await connectToDatabase()
    const config = await GoogleConnectionModel.findOne({ projectId })

    if (config?.clientId && config?.clientSecret) {
      try {
        clientId = decryptData(config.clientId)
        clientSecret = decryptData(config.clientSecret)
      } catch (decryptError) {
        console.error("Failed to decrypt client credentials:", decryptError)
        throw new Error(
          "Failed to decrypt stored OAuth credentials. Please reconfigure your Google connection."
        )
      }
    }
  }

  return new OAuth2Client(clientId, clientSecret, GSC_CONFIG.redirectUri)
}

/**
 * Generate Google OAuth authorization URL
 * Can use stored credentials from database if projectId is provided
 */
export async function generateAuthUrl(projectId: string, state?: string) {
  const client = await createOAuth2Client(projectId)

  return client.generateAuthUrl({
    access_type: "offline",
    scope: GSC_CONFIG.scopes,
    state: state || projectId,
    prompt: "consent" // Force consent to get refresh token
  })
}

/**
 * Exchange authorization code for tokens
 * Can use stored credentials from database if projectId is provided
 */
export async function exchangeCodeForTokens(code: string, projectId?: string) {
  const client = await createOAuth2Client(projectId)

  try {
    const { tokens } = await client.getToken(code)
    return tokens
  } catch (error) {
    console.error("Error exchanging code for tokens:", error)
    throw new Error("Failed to exchange authorization code for tokens")
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string) {
  const client = await createOAuth2Client()
  client.setCredentials({ refresh_token: refreshToken })

  try {
    const { credentials } = await client.refreshAccessToken()
    return credentials
  } catch (error) {
    console.error("Error refreshing access token:", error)
    throw new Error("Failed to refresh access token")
  }
}

/**
 * Get active Google connection for a project
 */
export async function getActiveConnection(projectId: string) {
  await connectToDatabase()

  const connection = await GoogleConnectionModel.findOne({
    projectId,
    isActive: true
  })

  if (!connection) {
    // Try to find any connection to give better debug info
    const anyConnection = await GoogleConnectionModel.findOne({ projectId })

    if (!anyConnection) {
      throw new Error(
        "Google Search Console not connected. Please go to SEO settings and complete the connection setup."
      )
    }

    if (!anyConnection.accessToken) {
      throw new Error(
        "Google authentication incomplete. Access token not found. Please reconfigure your Google connection."
      )
    }

    if (!anyConnection.propertyUrl) {
      throw new Error("Website not selected. Please complete website selection in SEO settings.")
    }

    throw new Error("Google Search Console connection is not active. Please check SEO settings.")
  }

  // Validate tokens exist
  if (!connection.accessToken) {
    throw new Error(
      "Access token missing. Please reconfigure your Google connection in SEO settings."
    )
  }

  if (!connection.refreshToken) {
    throw new Error(
      "Refresh token missing. Please reconfigure your Google connection in SEO settings."
    )
  }

  if (!connection.propertyUrl) {
    throw new Error("Website property not set. Please select a website in SEO settings.")
  }

  // Decrypt tokens
  let decryptedAccessToken: string
  let decryptedRefreshToken: string

  try {
    decryptedAccessToken = decryptData(connection.accessToken)
    decryptedRefreshToken = decryptData(connection.refreshToken)
  } catch (decryptError) {
    console.error("Token decryption failed:", decryptError)
    throw new Error(
      "Failed to decrypt stored tokens. Please reconfigure your Google connection in SEO settings."
    )
  }

  // Override connection with decrypted tokens for API calls
  connection.accessToken = decryptedAccessToken
  connection.refreshToken = decryptedRefreshToken

  // Check if token needs refresh
  const now = new Date()
  if (connection.tokenExpiresAt && connection.tokenExpiresAt <= now) {
    try {
      const newCredentials = await refreshAccessToken(decryptedRefreshToken)

      // Encrypt and update the new tokens
      connection.accessToken = encryptData(newCredentials.access_token || decryptedAccessToken)
      connection.refreshToken = encryptData(newCredentials.refresh_token || decryptedRefreshToken)
      connection.tokenExpiresAt = new Date(Date.now() + (newCredentials.expiry_date || 3600000))
      await connection.save()

      // Update local decrypted tokens for current request
      connection.accessToken = newCredentials.access_token || decryptedAccessToken
      connection.refreshToken = newCredentials.refresh_token || decryptedRefreshToken
    } catch (refreshError) {
      console.error("Token refresh failed:", refreshError)
      throw new Error(
        "Failed to refresh Google authentication. Please reconfigure your connection in SEO settings."
      )
    }
  }

  return connection
}

/**
 * Make authenticated request to Google Search Console API
 */
async function makeAuthenticatedRequest(
  projectId: string,
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: any
) {
  const connection = await getActiveConnection(projectId)

  // Validate token before making request
  if (!connection.accessToken) {
    throw new Error("Access token is missing or empty. Please reconfigure Google authentication.")
  }

  try {
    console.log(`[GSC API] Making ${method} request to: ${endpoint}`)
    console.log(`[GSC API] Project: ${projectId}, Property: ${connection.propertyUrl}`)
    console.log(`[GSC API] Token length: ${connection.accessToken?.length || 0} chars`)

    const response = await fetch(endpoint, {
      method,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorMsg = errorData.error?.message || response.statusText
      console.error(`[GSC API Error] Status: ${response.status}, Message: ${errorMsg}`)
      throw new Error(`Google Search Console API error: ${response.status} - ${errorMsg}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[GSC API Error] ${projectId}:`, error)
    throw error
  }
}

/**
 * Get list of verified sites in Search Console
 */
export async function getSiteList(projectId: string) {
  return makeAuthenticatedRequest(
    projectId,
    "https://www.googleapis.com/webmasters/v3/sites",
    "GET"
  )
}

/**
 * Get search analytics data
 */
export async function getSearchAnalytics(
  projectId: string,
  params: SearchAnalyticsParams
): Promise<SearchAnalyticsResponse> {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(params.siteUrl)}/searchAnalytics/query`

  const requestBody = {
    startDate: params.startDate,
    endDate: params.endDate,
    dimensions: params.dimensions || [],
    type: params.type || "web",
    rowLimit: params.rowLimit || 1000,
    searchType: params.searchType || "web"
  }

  return makeAuthenticatedRequest(projectId, endpoint, "POST", requestBody)
}

/**
 * Get top queries for a site
 */
export async function getTopQueries(
  projectId: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit: number = 100
) {
  return getSearchAnalytics(projectId, {
    siteUrl,
    startDate,
    endDate,
    dimensions: ["query"],
    rowLimit: limit
  })
}

/**
 * Get top pages for a site
 */
export async function getTopPages(
  projectId: string,
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit: number = 100
) {
  return getSearchAnalytics(projectId, {
    siteUrl,
    startDate,
    endDate,
    dimensions: ["page"],
    rowLimit: limit
  })
}

/**
 * Get URL inspection data
 */
export async function inspectUrl(projectId: string, siteUrl: string, requestUrl: string) {
  const endpoint = `https://searchconsole.googleapis.com/v1/urlInspection/index:inspect`

  const requestBody = {
    inspectionUrl: requestUrl,
    siteUrl: siteUrl
  }

  return makeAuthenticatedRequest(projectId, endpoint, "POST", requestBody)
}

/**
 * Get sitemaps for a site
 */
export async function getSitemaps(projectId: string, siteUrl: string) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps`

  return makeAuthenticatedRequest(projectId, endpoint, "GET")
}

/**
 * Get mobile usability issues
 */
export async function getMobileUsabilityIssues(
  projectId: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/mobileUsabilityIssues/query`

  const requestBody = {
    startDate,
    endDate
  }

  return makeAuthenticatedRequest(projectId, endpoint, "POST", requestBody)
}

/**
 * Get rich results issues
 */
export async function getRichResultsIssues(
  projectId: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/urlInspection/index:inspect`

  const requestBody = {
    inspectionUrl: siteUrl,
    siteUrl: siteUrl
  }

  return makeAuthenticatedRequest(projectId, endpoint, "POST", requestBody)
}
