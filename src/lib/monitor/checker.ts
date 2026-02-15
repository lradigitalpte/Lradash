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

export async function getSSLExpiry(host: string): Promise<{ expiryDate?: Date; error?: string }> {
  return new Promise((resolve) => {
    try {
      const socket = tls.connect(443, host, { servername: host }, () => {
        const cert = socket.getPeerCertificate()
        if (cert && cert.valid_to) {
          resolve({ expiryDate: new Date(cert.valid_to) })
        } else {
          resolve({ error: "Certificate not found" })
        }
        socket.end()
      })

      socket.on("error", (err) => {
        resolve({ error: err.message })
      })

      socket.setTimeout(5000, () => {
        socket.destroy()
        resolve({ error: "Timeout connecting to host" })
      })
    } catch (error: any) {
      resolve({ error: error.message })
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
