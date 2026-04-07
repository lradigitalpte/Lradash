# Client Flow Test Checklist

This checklist validates the full client portal flow end-to-end with the new access controls.

## Prerequisites

- App is running and DB is reachable.
- SMTP is configured if you want to test digest email delivery:
  - SMTP_HOST
  - SMTP_PORT
  - SMTP_USER
  - SMTP_PASSWORD
  - SMTP_FROM_EMAIL (optional)
  - SMTP_FROM_NAME (optional)
- CRON_SECRET is set (for cron trigger route testing).

## 1) Invite a Client User

1. Login as organization owner/admin.
2. Open team/invite UI and invite user with role `CLIENT`.
3. Confirm invite API response includes `invitationUrl`.
4. Open invite link and accept:
   - Existing user path and new user path both work.
5. Confirm accepted user can login successfully.

Expected:
- User account exists with org membership role `CLIENT`.
- Client login redirects to `/en/client`.

## 2) Verify Client Shell Restrictions

1. Login as client user.
2. Confirm sidebar shows client-safe navigation only.
3. Try direct URL navigation to internal sections (boards/tasks/team/report admin pages).

Expected:
- Client remains constrained to allowed client routes.
- Internal routes are denied/redirected.

## 3) Configure Project Share Controls

1. Login as owner/admin (or project owner).
2. Open project settings page.
3. Use **Client Report Sharing** toggles to select one or more client users.
4. Save changes.

Expected:
- Save succeeds.
- Success toast includes shared count.
- API `PUT /api/projects/:projectId/client-sharing` returns selected client IDs.

## 4) Validate Client Project Visibility

1. Login as selected client user.
2. Open `/en/client` portal.
3. Note visible project cards.
4. Remove that client from one project sharing and save again.
5. Refresh client portal.

Expected:
- Client only sees explicitly shared projects.
- Removed project no longer appears.

## 5) Validate PDF Export

1. While logged in as client, click **Download PDF** on client portal.
2. Open downloaded file.

Expected:
- File downloads successfully as PDF.
- Summary and project-level metrics render correctly.

## 6) Validate Weekly Digest Trigger

### A) Dry run (recommended first)

Run:
`GET /api/client/weekly-digest/cron?key=<CRON_SECRET>&dryRun=1`

Expected:
- JSON returns `dryRun: true` and non-zero scan counters (if client users exist).

### B) Real send

Run:
`GET /api/client/weekly-digest/cron?key=<CRON_SECRET>`

Expected:
- `sent` increments for eligible clients.
- Digest log records are created in `ClientDigestLog`.
- Emails arrive (if SMTP configured).

### C) Duplicate protection

Run again for the same week without `force=1`.

Expected:
- Already sent users are skipped.
- `sent` should not duplicate for same week key.

## 7) Authorization Regression Checks

### Project endpoints

- As `CLIENT`, verify forbidden on write operations:
  - project update/delete
  - project members add
  - marketing cluster/report create/update/delete
  - project cost update/delete

### Role-based mutation checks

- As org `MEMBER` (not owner/admin/project owner), verify read may work where allowed but writes are rejected.
- As org `OWNER`/`ADMIN` and project owner, verify writes are allowed.

## 8) Smoke Compile Check

Run:
`pnpm exec tsc --noEmit --pretty false`

Expected:
- No TypeScript errors.

## Notes

- If testing digest from authenticated route without cron key, use an owner/admin account (scope is limited to their org).
- If emails do not send, verify SMTP env vars and network access to SMTP host.
