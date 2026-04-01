import { getFromAddress, getTransporter } from "@/lib/email/transporter"
import { getAppUrl } from "@/lib/url/get-app-url"

export type UserEmailType = "project_member_added" | "password_reset"

interface SendUserEmailInput {
  to: string
  type: UserEmailType
  recipientName: string
  subjectEntity: string
  bodyText: string
  actionUrl: string
  actionLabel: string
}

function baseLayout(content: string): string {
  const appUrl = getAppUrl()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>LRA Dashboard Notification</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
              <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">LRA Dashboard</h1>
              <p style="margin:4px 0 0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Account Notification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;">${content}</td>
          </tr>
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                This email was sent by <a href="${appUrl}" style="color:#2563eb;text-decoration:none;font-weight:600;">LRA Dashboard</a>.
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">&copy; ${new Date().getFullYear()} LRA Digital. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function buildEmail(input: SendUserEmailInput): { subject: string; html: string } {
  if (input.type === "password_reset") {
    return {
      subject: "Reset your LRA Dashboard password",
      html: baseLayout(`
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Password Reset</p>
        <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">Reset your password</h2>
        <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Hi <strong>${input.recipientName}</strong>,<br/>${input.bodyText}</p>
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
          <tr>
            <td style="border-radius:10px;background:#dc2626;">
              <a href="${input.actionUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">${input.actionLabel}</a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">If you did not request this, you can ignore this email. The reset link expires in 1 hour.</p>
      `)
    }
  }

  return {
    subject: `You've been added to ${input.subjectEntity}`,
    html: baseLayout(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2563eb;text-transform:uppercase;letter-spacing:1px;">Project Member Added</p>
      <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">${input.subjectEntity}</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Hi <strong>${input.recipientName}</strong>,<br/>${input.bodyText}</p>
      <table role="presentation" cellspacing="0" cellpadding="0">
        <tr>
          <td style="border-radius:10px;background:#2563eb;">
            <a href="${input.actionUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">${input.actionLabel}</a>
          </td>
        </tr>
      </table>
    `)
  }
}

export async function sendUserEmail(input: SendUserEmailInput): Promise<boolean> {
  if (!input.to) {
    return false
  }

  const transporter = getTransporter()
  if (!transporter) {
    return false
  }

  const email = buildEmail(input)

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: input.to,
      subject: email.subject,
      html: email.html
    })
    return true
  } catch (error) {
    console.error(`[Email] Failed to send ${input.type} email to ${input.to}:`, error)
    return false
  }
}
