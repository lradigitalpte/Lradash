import { promises as dns } from "dns"

import { NextRequest, NextResponse } from "next/server"

interface DNSResult {
  domain: string
  registrar: string | null
  nameservers: string[]
  aRecords: string[]
  mxRecords: Array<{ exchange: string; priority: number }>
  soaRecord: any | null
  cnameRecords: string[]
  txtRecords: string[][]
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain name is required" }, { status: 400 })
    }

    const result: DNSResult = {
      domain,
      registrar: null,
      nameservers: [],
      aRecords: [],
      mxRecords: [],
      soaRecord: null,
      cnameRecords: [],
      txtRecords: [],
      timestamp: new Date().toISOString()
    }

    try {
      // Get A records (IPv4 addresses)
      const addresses = await dns.resolve4(domain)
      result.aRecords = addresses || []
    } catch (e) {
      // A record lookup failed, continue with other lookups
    }

    try {
      // Get nameservers
      const nameservers = await dns.resolveNs(domain)
      result.nameservers = nameservers || []
    } catch (e) {
      // Nameserver lookup failed
    }

    try {
      // Get MX records
      const mxRecords = await dns.resolveMx(domain)
      result.mxRecords = (mxRecords || []).map((mx: any) => ({
        exchange: mx.exchange,
        priority: mx.priority
      }))
    } catch (e) {
      // MX lookup failed
    }

    try {
      // Get SOA record
      const soaRecord = await dns.resolveSoa(domain)
      if (soaRecord) {
        result.soaRecord = {
          nsname: soaRecord.nsname,
          hostmaster: soaRecord.hostmaster,
          serial: soaRecord.serial,
          refresh: soaRecord.refresh,
          retry: soaRecord.retry,
          expire: soaRecord.expire,
          minttl: soaRecord.minttl
        }
      }
    } catch (e) {
      // SOA lookup failed
    }

    try {
      // Get CNAME records
      const cnameRecords = await dns.resolveCname(domain)
      result.cnameRecords = cnameRecords || []
    } catch (e) {
      // CNAME lookup failed (expected for non-CNAME domains)
    }

    try {
      // Get TXT records
      const txtRecords = await dns.resolveTxt(domain)
      result.txtRecords = txtRecords || []
    } catch (e) {
      // TXT lookup failed
    }

    // Attempt to detect registrar from nameservers
    if (result.nameservers.length > 0) {
      const ns = result.nameservers[0].toLowerCase()
      if (ns.includes("godaddy")) {
        result.registrar = "GoDaddy"
      } else if (ns.includes("namecheap")) {
        result.registrar = "Namecheap"
      } else if (ns.includes("amazon") || ns.includes("route53")) {
        result.registrar = "AWS Route53"
      } else if (ns.includes("cloudflare")) {
        result.registrar = "Cloudflare"
      } else if (ns.includes("google")) {
        result.registrar = "Google Domains"
      } else if (ns.includes("networksolutions")) {
        result.registrar = "Network Solutions"
      } else if (ns.includes("bluehost")) {
        result.registrar = "Bluehost"
      } else if (ns.includes("porkbun")) {
        result.registrar = "Porkbun"
      } else if (ns.includes("domain.com")) {
        result.registrar = "Domain.com"
      } else {
        result.registrar = "Custom Registrar"
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("DNS lookup error:", error)
    return NextResponse.json({ error: error.message || "DNS lookup failed" }, { status: 500 })
  }
}
