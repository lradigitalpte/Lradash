import { NextRequest, NextResponse } from "next/server"

import { verifyAccessToken } from "@/lib/auth/tokens"
import { getOrgEvents, createEventInDb } from "@/lib/db/event"
import { getUserByEmail } from "@/lib/db/user"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserByEmail(decoded.email)
    if (!user || !user.defaultOrganizationId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    const events = await getOrgEvents(user.defaultOrganizationId)
    return NextResponse.json(events)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyAccessToken(token)
    if (!decoded || !decoded.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    const event = await createEventInDb(decoded.email, body)
    return NextResponse.json(event)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
