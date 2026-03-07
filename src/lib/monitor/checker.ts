import net from "net"
import tls from "tls"

export async function checkWebsite(
  url: string
): Promise<{ status: "UP" | "DOWN"; responseTime: number }> {
  const start = Date.now()
  try {
    const response = await fetch(url, { method: "GET", cache: "no-store", next: { revalidate: 0 } })
    const responseTime = Date.now() - start
    if (response.ok) {
      return { status: "UP", responseTime }
    }
    return { status: "DOWN", responseTime }
  } catch (error) {
    return { status: "DOWN", responseTime: Date.now() - start }
  }
}

export async function checkPort(
  host: string,
  port: number
): Promise<{ status: "UP" | "DOWN"; responseTime: number }> {
  const start = Date.now()
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(5000)

    socket.on("connect", () => {
      const responseTime = Date.now() - start
      socket.destroy()
      resolve({ status: "UP", responseTime })
    })

    socket.on("timeout", () => {
      socket.destroy()
      resolve({ status: "DOWN", responseTime: Date.now() - start })
    })

    socket.on("error", () => {
      socket.destroy()
      resolve({ status: "DOWN", responseTime: Date.now() - start })
    })

    socket.connect(port, host)
  })
}

/** Strip protocol, path, and normalize for TLS (hostname only, lowercase). */
function normalizeSSLTarget(target: string): string {
  if (!target || typeof target !== "string") {
    return ""
  }
  let s = target.trim()
  try {
    if (!s.includes("://")) {
      s = "https://" + s
    }
    const u = new URL(s)
    const host = (u.hostname || u.host || s).replace(/^\[|\]$/g, "")
    return host ? host.toLowerCase() : ""
  } catch {
    return (
      s
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        .split(":")[0]
        .toLowerCase() || ""
    )
  }
}

export async function getSSLExpiry(host: string): Promise<{ expiryDate?: Date; error?: string }> {
  const hostname = normalizeSSLTarget(host)
  if (!hostname) {
    return Promise.resolve({ error: "Invalid or missing hostname" })
  }
  return new Promise((resolve) => {
    let resolved = false
    const once = (result: { expiryDate?: Date; error?: string }) => {
      if (resolved) {
        return
      }
      resolved = true
      resolve(result)
    }
    try {
      const socket = tls.connect(
        443,
        hostname,
        {
          servername: hostname,
          rejectUnauthorized: false // allow reading cert expiry even if chain is incomplete
        },
        () => {
          const cert = socket.getPeerCertificate(true)
          if (cert && (cert.valid_to || (cert as any).validTo)) {
            const raw = cert.valid_to || (cert as any).validTo
            const expiryDate = typeof raw === "string" ? new Date(raw) : new Date(raw)
            if (!isNaN(expiryDate.getTime())) {
              once({ expiryDate })
            } else {
              once({ error: "Invalid certificate expiry" })
            }
          } else {
            once({ error: "Certificate not found or no expiry" })
          }
          socket.destroy()
        }
      )

      socket.on("error", (err) => {
        once({ error: err.message || "TLS error" })
        socket.destroy()
      })

      socket.setTimeout(10000, () => {
        once({ error: "Timeout connecting to host (10s)" })
        socket.destroy()
      })
    } catch (error: any) {
      once({ error: error?.message || "Connection failed" })
    }
  })
}

// Basic check for email servers (SMTP, IMAP, POP3)
export async function checkEmailServer(
  host: string,
  port: number = 25
): Promise<{ status: "UP" | "DOWN"; responseTime: number }> {
  return checkPort(host, port)
}
