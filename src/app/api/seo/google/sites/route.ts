import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { connectToDatabase } from "@/lib/db/connect"
import { getSiteList } from "@/lib/seo/google-search-console"
import { GoogleConnectionModel } from "@/models/google-connection.model"

/**
 * Get list of available websites from Google Search Console
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 })
    }

    await connectToDatabase()

    // Get connection with tokens but check if tokens are actually present
    const connection = await GoogleConnectionModel.findOne({ projectId })

    if (!connection) {
      return NextResponse.json(
        { error: "Connection not found. Please configure credentials first." },
        { status: 404 }
      )
    }

    if (!connection.accessToken) {
      return NextResponse.json(
        { error: "Access token not found. Please complete Google authentication first." },
        { status: 400 }
      )
    }

    // Get sites from Google Search Console
    try {
      const sites = await getSiteList(projectId)

      if (!sites.siteEntry || sites.siteEntry.length === 0) {
        return NextResponse.json(
          {
            sites: [],
            message: "No verified websites found in your Google Search Console account"
          },
          { status: 200 }
        )
      }

      // Return formatted site list
      const formattedSites = sites.siteEntry.map((site: any) => ({
        url: site.siteUrl,
        type: site.siteUrl.includes("sc-domain:") ? "domain" : "url-prefix",
        displayName: site.siteUrl.replace("sc-domain:", "")
      }))

      return NextResponse.json({ sites: formattedSites }, { status: 200 })
    } catch (siteError) {
      console.error("Error fetching sites:", siteError)
      throw new Error("Failed to fetch website list from Google Search Console")
    }
  } catch (error) {
    console.error("Get sites error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get sites" },
      { status: 500 }
    )
  }
}
