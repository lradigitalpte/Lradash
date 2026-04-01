/**
 * Email HTML templates for task notifications.
 *
 * Styled inline for maximum email-client compatibility (Gmail, Outlook, Apple Mail).
 * Design inspired by Trello / Linear notification emails.
 */

export interface TaskEmailData {
  taskTitle: string
  taskDescription?: string
  taskStatus?: string
  taskPriority?: string
  taskDueDate?: string
  projectName?: string
  triggeredByName: string
  triggeredByAvatar?: string
  recipientName: string
  taskUrl: string
  appUrl: string
  actionUrl?: string
  actionLabel?: string
}

function getPriorityColor(priority?: string): string {
  switch (priority?.toUpperCase()) {
    case "URGENT":
      return "#dc2626"
    case "HIGH":
      return "#ea580c"
    case "MEDIUM":
      return "#2563eb"
    case "LOW":
      return "#6b7280"
    default:
      return "#6b7280"
  }
}

function getStatusBadge(status?: string): string {
  const colors: Record<string, { bg: string; text: string }> = {
    TODO: { bg: "#f1f5f9", text: "#475569" },
    IN_PROGRESS: { bg: "#dbeafe", text: "#1d4ed8" },
    DONE: { bg: "#dcfce7", text: "#15803d" }
  }
  const c = colors[status?.toUpperCase() ?? ""] || colors.TODO
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;background:${c.bg};color:${c.text};">${status?.replace("_", " ") || "TODO"}</span>`
}

function baseLayout(content: string, appUrl: string): string {
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
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#334155 100%);padding:32px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h1 style="margin:0;font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px;">LRA Dashboard</h1>
                    <p style="margin:4px 0 0;font-size:11px;font-weight:600;color:#94a3b8;letter-spacing:2px;text-transform:uppercase;">Task Notification</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e2e8f0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                      This email was sent by <a href="${appUrl}" style="color:#2563eb;text-decoration:none;font-weight:600;">LRA Dashboard</a>.
                      You're receiving this because you're part of a task.
                    </p>
                    <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">
                      &copy; ${new Date().getFullYear()} LRA Digital. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Email when a task is assigned to someone */
export function taskAssignedEmail(data: TaskEmailData): { subject: string; html: string } {
  const subject = `📋 You've been assigned: "${data.taskTitle}"`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;">New Assignment</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      <strong>${data.triggeredByName}</strong> has assigned you a task${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""}.
    </p>

    ${
      data.taskDescription
        ? `<div style="margin:0 0 24px;padding:16px 20px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${data.taskDescription.slice(0, 300)}${data.taskDescription.length > 300 ? "…" : ""}</p>
          </div>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
      ${
        data.taskPriority
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Priority</td>
              <td style="padding:6px 0;">
                <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${getPriorityColor(data.taskPriority)};">${data.taskPriority}</span>
              </td>
            </tr>`
          : ""
      }
      ${
        data.taskStatus
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Status</td>
              <td style="padding:6px 0;">${getStatusBadge(data.taskStatus)}</td>
            </tr>`
          : ""
      }
      ${
        data.taskDueDate
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Due Date</td>
              <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;">${data.taskDueDate}</td>
            </tr>`
          : ""
      }
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#2563eb;">
          <a href="${data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Task →
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}

/** Email when a task the user created/assigned gets updated */
export function taskUpdatedEmail(data: TaskEmailData & { changes: string }): {
  subject: string
  html: string
} {
  const subject = `🔄 Task updated: "${data.taskTitle}"`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Task Update</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      <strong>${data.triggeredByName}</strong> made changes to a task${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""}.
    </p>

    <div style="margin:0 0 24px;padding:16px 20px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;font-weight:600;color:#92400e;text-transform:uppercase;letter-spacing:0.5px;">What changed</p>
      <p style="margin:8px 0 0;font-size:14px;color:#78350f;line-height:1.6;">${data.changes}</p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
      ${
        data.taskStatus
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Status</td>
              <td style="padding:6px 0;">${getStatusBadge(data.taskStatus)}</td>
            </tr>`
          : ""
      }
      ${
        data.taskPriority
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Priority</td>
              <td style="padding:6px 0;">
                <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${getPriorityColor(data.taskPriority)};">${data.taskPriority}</span>
              </td>
            </tr>`
          : ""
      }
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#2563eb;">
          <a href="${data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Task →
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}

/** Email when a task is created (notification to creator) */
export function taskCreatedEmail(data: TaskEmailData): { subject: string; html: string } {
  const subject = `✅ Task created: "${data.taskTitle}"`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:1px;">New Task</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      A new task has been created${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""} by <strong>${data.triggeredByName}</strong>.
    </p>

    ${
      data.taskDescription
        ? `<div style="margin:0 0 24px;padding:16px 20px;background:#f8fafc;border-left:4px solid #10b981;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#475569;line-height:1.6;">${data.taskDescription.slice(0, 300)}${data.taskDescription.length > 300 ? "…" : ""}</p>
          </div>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
      ${
        data.taskPriority
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Priority</td>
              <td style="padding:6px 0;">
                <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${getPriorityColor(data.taskPriority)};">${data.taskPriority}</span>
              </td>
            </tr>`
          : ""
      }
      ${
        data.taskDueDate
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Due Date</td>
              <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;">${data.taskDueDate}</td>
            </tr>`
          : ""
      }
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#10b981;">
          <a href="${data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Task →
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}

/** Email when a task is due in the next 12 hours */
export function taskDeadlineReminderEmail(data: TaskEmailData): { subject: string; html: string } {
  const subject = `⏰ Deadline soon: "${data.taskTitle}" is due in 12 hours`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#b45309;text-transform:uppercase;letter-spacing:1px;">Deadline Reminder</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      This task is due in less than <strong>12 hours</strong>${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""}. Please review it now.
    </p>

    <div style="margin:0 0 24px;padding:16px 20px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#9a3412;text-transform:uppercase;letter-spacing:0.5px;">Action needed</p>
      <p style="margin:8px 0 0;font-size:14px;color:#7c2d12;line-height:1.6;">
        The deadline is approaching. Make sure the task is updated or completed before the due time.
      </p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
      ${
        data.taskPriority
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Priority</td>
              <td style="padding:6px 0;">
                <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;color:#fff;background:${getPriorityColor(data.taskPriority)};">${data.taskPriority}</span>
              </td>
            </tr>`
          : ""
      }
      ${
        data.taskStatus
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Status</td>
              <td style="padding:6px 0;">${getStatusBadge(data.taskStatus)}</td>
            </tr>`
          : ""
      }
      ${
        data.taskDueDate
          ? `<tr>
              <td style="padding:6px 0;font-size:13px;color:#94a3b8;font-weight:600;width:100px;">Due Date</td>
              <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:600;">${data.taskDueDate}</td>
            </tr>`
          : ""
      }
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#f59e0b;">
          <a href="${data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            Open Task →
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}

/** Email when a task is completed */
export function taskCompletedEmail(data: TaskEmailData): { subject: string; html: string } {
  const subject = `🎉 Task completed: "${data.taskTitle}"`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;letter-spacing:1px;">Task Complete</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      <strong>${data.triggeredByName}</strong> has completed a task${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""}.
    </p>

    <div style="margin:0 0 24px;padding:20px;background:#f0fdf4;border-radius:12px;text-align:center;">
      <p style="margin:0;font-size:32px;">🎉</p>
      <p style="margin:8px 0 0;font-size:16px;font-weight:700;color:#15803d;">Task Completed!</p>
    </div>

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#15803d;">
          <a href="${data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            View Task →
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}

/** Email when a user is mentioned in a task comment */
export function mentionEmail(data: TaskEmailData): { subject: string; html: string } {
  const subject = `@ You were mentioned in "${data.taskTitle}"`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">Mention</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      <strong>${data.triggeredByName}</strong> mentioned you in a comment${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""}.
    </p>

    ${
      data.taskDescription
        ? `<div style="margin:0 0 24px;padding:16px 20px;background:#faf5ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:13px;font-weight:700;color:#6b21a8;text-transform:uppercase;letter-spacing:0.5px;">Comment</p>
            <p style="margin:8px 0 0;font-size:14px;color:#581c87;line-height:1.6;">${data.taskDescription.slice(0, 400)}${data.taskDescription.length > 400 ? "…" : ""}</p>
          </div>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#7c3aed;">
          <a href="${data.actionUrl || data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            ${data.actionLabel || "Open Task Discussion →"}
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}

/** Email when a new project announcement is created */
export function announcementCreatedEmail(data: TaskEmailData): { subject: string; html: string } {
  const subject = `📢 New announcement: "${data.taskTitle}"`

  const content = `
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Project Announcement</p>
    <h2 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#0f172a;line-height:1.3;">
      ${data.taskTitle}
    </h2>

    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
      Hi <strong>${data.recipientName}</strong>,<br/>
      <strong>${data.triggeredByName}</strong> posted a new announcement${data.projectName ? ` in <strong>${data.projectName}</strong>` : ""}.
    </p>

    ${
      data.taskDescription
        ? `<div style="margin:0 0 24px;padding:16px 20px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;">
            <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.7;">${data.taskDescription.slice(0, 500)}${data.taskDescription.length > 500 ? "…" : ""}</p>
          </div>`
        : ""
    }

    <table role="presentation" cellspacing="0" cellpadding="0">
      <tr>
        <td style="border-radius:10px;background:#dc2626;">
          <a href="${data.actionUrl || data.taskUrl}" style="display:inline-block;padding:14px 32px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
            ${data.actionLabel || "Open Project →"}
          </a>
        </td>
      </tr>
    </table>
  `

  return { subject, html: baseLayout(content, data.appUrl) }
}
