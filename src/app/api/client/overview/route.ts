import { NextRequest, NextResponse } from "next/server"

import { requireClientAccess } from "@/lib/auth/organization-access"
import { getClientOverviewData } from "@/lib/client/overview"

export async function GET(request: NextRequest) {
  try {
    const access = await requireClientAccess(request)
    if ("error" in access) {
      return access.error
    }

    const overview = await getClientOverviewData(access)

    return NextResponse.json(overview)
  } catch (error) {
    console.error("Client overview error:", error)
    return NextResponse.json({ error: "Failed to fetch client overview" }, { status: 500 })
  }
}
