/**
 * Helper to resolve a user's notification email.
 *
 * Prefers `notificationEmail` if set, otherwise falls back to the
 * account `email`.  Accepts any object with those optional fields so
 * it works with both Mongoose documents and lean() results.
 */

export function getNotificationEmail(
  user: { notificationEmail?: string; email?: string } | null | undefined
): string {
  if (!user) {
    return ""
  }
  return user.notificationEmail?.trim() || user.email || ""
}
