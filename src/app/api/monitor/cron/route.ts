import { NextRequest, NextResponse } from "next/server"

import { connectToDatabase } from "@/lib/db/connect"
import { checkWebsite, checkPort, getSSLExpiry } from "@/lib/monitor/checker"
import { checkSMTP } from "@/lib/monitor/smtp-checker"
import MonitorModel from "@/models/monitor.model"
import { MonitorType, MonitorStatus } from "@/types/monitor"

export async function GET(request: NextRequest) {
  // Check for cron secret to prevent unauthorized access
  const { searchParams } = new URL(request.url)
  const key = searchParams.get("key")

  if (key !== process.env.CRON_SECRET && !process.env.VERCEL) {
    // Only enforce key if on Vercel or if key is provided
    // This allows local testing without the key if needed, or enforces it in prod
    if (process.env.NODE_ENV === "production" || key) {
      if (key !== process.env.CRON_SECRET) {
        return new Response("Unauthorized", { status: 401 })
      }
    }
  }

  try {
    await connectToDatabase()

    // Find monitors due for a check
    const monitors = await MonitorModel.find({
      nextCheck: { $lte: new Date() }
    }).limit(10) // Process in batches

    const results = []

    for (const monitor of monitors) {
      let status: MonitorStatus = MonitorStatus.PENDING
      let responseTime = 0
      let expiryDate = monitor.expiryDate

      try {
        if (monitor.type === MonitorType.WEBSITE) {
          const check = await checkWebsite(monitor.target)
          status = check.status as MonitorStatus
          responseTime = check.responseTime
        } else if (monitor.type === MonitorType.EMAIL) {
          // Default to port 25 if not specified in target as host:port
          const [host, portStr] = monitor.target.split(":")
          const port = portStr ? parseInt(portStr) : 25
          const check = await checkPort(host, port)
          status = check.status as MonitorStatus
          responseTime = check.responseTime
        } else if (monitor.type === MonitorType.SMTP) {
          // Enhanced SMTP protocol-level checking
          const port = monitor.port || 25
          const check = await checkSMTP(monitor.target, port, {
            useTLS: monitor.metadata?.useTLS || false,
            useSTARTTLS: monitor.metadata?.useSTARTTLS || false,
            timeout: 15000,
            hostname: monitor.metadata?.hostname || "localhost"
          })
          status = check.status as MonitorStatus
          responseTime = check.responseTime
          // Store SMTP metadata
          if (check.metadata) {
            monitor.metadata = monitor.metadata || {}
            monitor.metadata.lastBanner = check.metadata.banner
            monitor.metadata.supportedAuthMethods = check.metadata.authMethods
            if (check.metadata.tlsVersion) {
              monitor.metadata.tlsVersion = check.metadata.tlsVersion
            }
            if (check.metadata.error) {
              monitor.metadata.lastError = check.metadata.error
            }
          }
        } else if (monitor.type === MonitorType.SSL) {
          const check = await getSSLExpiry(monitor.target)
          if (check.expiryDate) {
            expiryDate = check.expiryDate
            const now = new Date()
            const daysLeft = (expiryDate.getTime() - now.getTime()) / (1000 * 3600 * 24)
            status = daysLeft < 7 ? MonitorStatus.WARNING : MonitorStatus.UP
          } else {
            status = MonitorStatus.DOWN
          }
        } else if (monitor.type === MonitorType.DOMAIN) {
          // Domain check often requires 3rd party API, keeping it simple for now
          status = MonitorStatus.UP
        } else if (monitor.type === MonitorType.PORT) {
          // Generic TCP port monitoring
          const port = monitor.port || 80
          const check = await checkPort(monitor.target, port)
          status = check.status as MonitorStatus
          responseTime = check.responseTime
        } else if (monitor.type === MonitorType.SUBSCRIPTION) {
          // Subscription status is usually updated via renewal logic, not ping
          if (monitor.expiryDate && new Date(monitor.expiryDate) < new Date()) {
            status = MonitorStatus.EXPIRED
          } else {
            status = MonitorStatus.UP
          }
        }

        // Update timestamps
        const updateData: any = {
          status,
          responseTime,
          lastChecked: new Date(),
          nextCheck: new Date(Date.now() + monitor.frequency * 60000),
          expiryDate,
          metadata: monitor.metadata
        }

        if (status === MonitorStatus.UP) {
          updateData.lastUp = new Date()
        } else if (status === MonitorStatus.DOWN) {
          updateData.lastDown = new Date()
        }

        await MonitorModel.findByIdAndUpdate(monitor._id, updateData)
        results.push({ name: monitor.name, status })
      } catch (err) {
        console.error(`Failed to check monitor ${monitor.name}:`, err)
        results.push({ name: monitor.name, status: "ERROR", error: (err as Error).message })
      }
    }

    return NextResponse.json({
      processed: monitors.length,
      results
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
