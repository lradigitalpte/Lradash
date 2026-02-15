import net from "net"
import tls from "tls"

export interface SMTPCheckOptions {
  useTLS?: boolean // TLS on 465 (implicit)
  useSTARTTLS?: boolean // STARTTLS on 587
  timeout?: number // default 15000ms
  hostname?: string // for EHLO command, defaults to "localhost"
}

export interface SMTPCheckResult {
  status: "UP" | "DOWN"
  responseTime: number
  metadata?: {
    banner: string
    authMethods: string[]
    tlsVersion?: string
    error?: string
  }
}

/**
 * Check SMTP server health using protocol-level commands
 * Implements Level 1: basic connectivity with SMTP banner and EHLO response
 *
 * @param host - SMTP server hostname or IP
 * @param port - SMTP port (default 25, also supports 465, 587, 2525)
 * @param options - Additional SMTP options
 * @returns Promise with status, responseTime, and SMTP metadata
 */
export async function checkSMTP(
  host: string,
  port: number = 25,
  options: SMTPCheckOptions = {}
): Promise<SMTPCheckResult> {
  const startTime = Date.now()
  const timeout = options.timeout || 15000
  const hostname = options.hostname || "localhost"

  return new Promise((resolve) => {
    let socket: net.Socket | tls.TLSSocket
    let bannerReceived = false
    let ehloBannerReceived = false
    const authMethods: string[] = []
    let tlsVersion: string | undefined
    let commandCount = 0
    const maxCommands = 5 // Limit to prevent loops

    // Function to send a command and wait for response
    const sendCommand = (command: string) => {
      if (commandCount >= maxCommands) {
        cleanupAndQuit()
        return
      }
      commandCount++

      if (socket.writable) {
        socket.write(`${command}\r\n`)
      }
    }

    // Function to cleanup and disconnect gracefully
    const cleanupAndQuit = () => {
      if (socket && socket.writable) {
        socket.write("QUIT\r\n")
        socket.destroy()
      } else if (socket) {
        socket.destroy()
      }
    }

    // Set data handler for receiving SMTP responses
    const handleData = (data: Buffer) => {
      const response = data.toString().trim()

      // Parse banner (220 response)
      if (!bannerReceived && response.startsWith("220")) {
        bannerReceived = true
        // Send EHLO command after receiving banner
        sendCommand(`EHLO ${hostname}`)
        return
      }

      // Parse EHLO response (250 for final response, 250- for continuation)
      if (bannerReceived && !ehloBannerReceived && response.includes("250")) {
        // Parse EHLO lines for capabilities
        const lines = data.toString().split("\r\n")
        for (const line of lines) {
          if (line.startsWith("250-") || line.startsWith("250 ")) {
            const capability = line.substring(4).toUpperCase()

            // Extract AUTH methods
            if (capability.startsWith("AUTH ")) {
              const methods = capability.substring(5).split(" ")
              authMethods.push(...methods.filter((m) => m.length > 0))
            }

            // Check for STARTTLS
            if (capability === "STARTTLS" && !ehloBannerReceived) {
              // Don't actually initiate STARTTLS for basic monitoring
              // Just note that it's available
            }
          }

          // Final 250 response (not 250-)
          if (line.startsWith("250 ") && bannerReceived) {
            ehloBannerReceived = true
            cleanupAndQuit()
            return
          }
        }
      }

      // Handle error responses
      if (response.startsWith("5")) {
        // 5xx error
        cleanupAndQuit()
        return
      }
    }

    try {
      // Create appropriate socket based on TLS mode
      if (options.useTLS && (port === 465 || port === 587)) {
        // Implicit TLS
        socket = tls.connect(
          {
            host,
            port,
            servername: host,
            rejectUnauthorized: false // Allow self-signed certs for monitoring
          },
          () => {
            // TLS connected
            if (socket instanceof tls.TLSSocket) {
              const protocol = socket.getProtocol()
              if (protocol) {
                tlsVersion = protocol
              }
            }
          }
        )
      } else {
        // Plain TCP
        socket = net.createConnection({
          host,
          port,
          timeout
        })
      }

      socket.setEncoding("utf8")
      socket.setTimeout(timeout)

      // Handle socket data
      socket.on("data", handleData)

      // Handle timeout
      socket.on("timeout", () => {
        socket.destroy()
        resolve({
          status: "DOWN",
          responseTime: Date.now() - startTime,
          metadata: {
            banner: "",
            authMethods: [],
            error: "Timeout"
          }
        })
      })

      // Handle socket errors
      socket.on("error", (error) => {
        resolve({
          status: "DOWN",
          responseTime: Date.now() - startTime,
          metadata: {
            banner: "",
            authMethods: [],
            error: (error as Error).message
          }
        })
      })

      // Handle socket close
      socket.on("close", () => {
        // If we successfully received banner and EHLO, it's UP
        if (bannerReceived) {
          resolve({
            status: "UP",
            responseTime: Date.now() - startTime,
            metadata: {
              banner: `SMTP Server Responding on Port ${port}`,
              authMethods,
              tlsVersion
            }
          })
        } else {
          resolve({
            status: "DOWN",
            responseTime: Date.now() - startTime,
            metadata: {
              banner: "",
              authMethods: [],
              error: "No banner received"
            }
          })
        }
      })

      // Set overall timeout
      const overallTimeout = setTimeout(() => {
        if (socket) {
          socket.destroy()
        }
        resolve({
          status: "DOWN",
          responseTime: Date.now() - startTime,
          metadata: {
            banner: "",
            authMethods: [],
            error: "Overall timeout exceeded"
          }
        })
      }, timeout)

      socket.on("close", () => {
        clearTimeout(overallTimeout)
      })
    } catch (error) {
      resolve({
        status: "DOWN",
        responseTime: Date.now() - startTime,
        metadata: {
          banner: "",
          authMethods: [],
          error: (error as Error).message
        }
      })
    }
  })
}
