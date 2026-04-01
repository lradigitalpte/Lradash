/**
 * Nodemailer SMTP transporter — singleton.
 *
 * Uses Gmail SMTP with App Password authentication.
 * The transporter is lazily created and reused across requests.
 */

import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

let _transporter: Transporter | null = null

export function getTransporter(): Transporter | null {
  if (_transporter) {
    return _transporter
  }

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    console.warn("[Email] SMTP not configured – email notifications disabled")
    return null
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
    rateLimit: 10 // max 10 messages/second
  })

  return _transporter
}

export function getFromAddress(): string {
  const name = process.env.SMTP_FROM_NAME || "LRA Dashboard"
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || ""
  return `"${name}" <${email}>`
}
