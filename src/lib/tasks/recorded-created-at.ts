/** Optional backdated `createdAt` when logging work that should have been captured earlier. */

export function parseRecordedCreatedAt(input: unknown): { date?: Date; error?: string } {
  if (input == null || input === "") {
    return {}
  }
  const d = new Date(typeof input === "string" || typeof input === "number" ? input : String(input))
  if (Number.isNaN(d.getTime())) {
    return { error: "Invalid recorded created date" }
  }
  const now = new Date()
  if (d.getTime() > now.getTime()) {
    return { error: "Recorded created date cannot be in the future" }
  }
  const min = new Date()
  min.setFullYear(min.getFullYear() - 10)
  if (d < min) {
    return { error: "Recorded created date cannot be more than 10 years ago" }
  }
  return { date: d }
}
