import { ClientOverviewData } from "@/lib/client/overview"
import { getFromAddress, getTransporter } from "@/lib/email/transporter"
import { getAppUrl } from "@/lib/url/get-app-url"

interface SendClientWeeklyDigestInput {
  to: string
  recipientName: string
  overview: ClientOverviewData
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function renderEmailHtml(input: SendClientWeeklyDigestInput): string {
  const appUrl = getAppUrl()
  const clientUrl = `${appUrl}/en/client`
  const topProjects = input.overview.projects.slice(0, 8)

  const projectRows =
    topProjects.length > 0
      ? topProjects
          .map(
            (project) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${escapeHtml(project.title)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${project.taskStats.done}/${project.taskStats.total}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${project.taskStats.overdue}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${project.taskStats.completionRate}%</td>
          </tr>`
          )
          .join("")
      : `
        <tr>
          <td colspan="4" style="padding:14px 12px;font-size:13px;color:#64748b;">No projects are currently assigned to this client account.</td>
        </tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weekly Client Digest</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:28px 32px;">
              <h1 style="margin:0;font-size:21px;font-weight:800;color:#fff;">Weekly Client Digest</h1>
              <p style="margin:8px 0 0;font-size:12px;letter-spacing:1.2px;color:#94a3b8;text-transform:uppercase;">${escapeHtml(input.overview.viewer.organizationName)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 12px;font-size:15px;color:#334155;line-height:1.6;">Hi <strong>${escapeHtml(input.recipientName)}</strong>, here is your weekly portfolio snapshot.</p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 22px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 14px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Projects</td>
                  <td style="padding:12px 14px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Total Tasks</td>
                  <td style="padding:12px 14px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Overdue</td>
                  <td style="padding:12px 14px;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Completed</td>
                </tr>
                <tr>
                  <td style="padding:0 14px 14px;font-size:24px;font-weight:800;color:#0f172a;">${input.overview.summary.projectCount}</td>
                  <td style="padding:0 14px 14px;font-size:24px;font-weight:800;color:#0f172a;">${input.overview.summary.totalTasks}</td>
                  <td style="padding:0 14px 14px;font-size:24px;font-weight:800;color:#b91c1c;">${input.overview.summary.overdueTasks}</td>
                  <td style="padding:0 14px 14px;font-size:24px;font-weight:800;color:#15803d;">${input.overview.summary.completionRate}%</td>
                </tr>
              </table>

              <h2 style="margin:0 0 10px;font-size:15px;font-weight:800;color:#0f172a;">Project Breakdown</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;border-collapse:separate;border-spacing:0;">
                <tr style="background:#f8fafc;">
                  <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.6px;">Project</th>
                  <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.6px;">Done</th>
                  <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.6px;">Overdue</th>
                  <th align="left" style="padding:10px 12px;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.6px;">Completion</th>
                </tr>
                ${projectRows}
              </table>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top:24px;">
                <tr>
                  <td style="border-radius:10px;background:#2563eb;">
                    <a href="${clientUrl}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:700;color:#fff;text-decoration:none;">Open Client Portal</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">Generated automatically by LRA Dashboard. If you'd like a live view, open the client portal link above.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendClientWeeklyDigestEmail(
  input: SendClientWeeklyDigestInput
): Promise<boolean> {
  if (!input.to) {
    return false
  }

  const transporter = getTransporter()
  if (!transporter) {
    return false
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to: input.to,
      subject: `Weekly client digest - ${input.overview.viewer.organizationName}`,
      html: renderEmailHtml(input)
    })
    return true
  } catch (error) {
    console.error(`[Email] Failed to send weekly client digest to ${input.to}:`, error)
    return false
  }
}
