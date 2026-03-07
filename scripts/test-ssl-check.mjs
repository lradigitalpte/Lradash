/**
 * Quick test: run SSL expiry check for a host.
 * Usage: node scripts/test-ssl-check.mjs [host]
 * Example: node scripts/test-ssl-check.mjs https://frogmentec.ae
 */

import tls from "tls"

function normalizeSSLTarget(target) {
  if (!target || typeof target !== "string") return ""
  let s = target.trim()
  try {
    if (!s.includes("://")) s = "https://" + s
    const u = new URL(s)
    const host = (u.hostname || u.host || s).replace(/^\[|\]$/g, "")
    return host ? host.toLowerCase() : ""
  } catch {
    return s.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0].toLowerCase() || ""
  }
}

function getSSLExpiry(host) {
  const hostname = normalizeSSLTarget(host)
  if (!hostname) return Promise.resolve({ error: "Invalid hostname" })
  return new Promise((resolve) => {
    const socket = tls.connect(
      443,
      hostname,
      { servername: hostname, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate(true)
        console.log("Certificate keys:", cert ? Object.keys(cert) : "none")
        if (cert && (cert.valid_to || cert.validTo)) {
          const raw = cert.valid_to || cert.validTo
          const expiryDate = new Date(raw)
          console.log("valid_to (raw):", raw)
          resolve({ expiryDate, subject: cert.subject })
        } else {
          resolve({ error: "No cert or valid_to", cert: cert ? !!cert : false })
        }
        socket.destroy()
      }
    )
    socket.on("error", (err) => {
      console.error("TLS error:", err.message)
      resolve({ error: err.message })
      socket.destroy()
    })
    socket.setTimeout(10000, () => {
      resolve({ error: "Timeout" })
      socket.destroy()
    })
  })
}

const host = process.argv[2] || "https://frogmentec.ae"
console.log("Testing SSL check for:", host)
getSSLExpiry(host).then((r) => {
  console.log("Result:", JSON.stringify(r, null, 2))
  if (r.expiryDate) {
    console.log("Expiry (readable):", r.expiryDate.toISOString())
    const days = Math.ceil((r.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
    console.log("Days from now:", days)
  }
})
