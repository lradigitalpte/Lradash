import { addDays, addWeeks, format, isAfter, isBefore, isSameDay } from "date-fns"

interface RecurrenceConfig {
  enabled?: boolean
  frequency?: "DAILY" | "WEEKLY"
  interval?: number
  weekdays?: string[]
  until?: string | Date | null
}

interface MeetingLike {
  id: string
  title: string
  description?: string
  startTime: string | Date
  endTime: string | Date
  timezone: string
  status: string
  meetUri?: string | null
  meetCode?: string | null
  calendarHtmlLink?: string | null
  recurrence?: RecurrenceConfig | null
  attendees?: Array<{ email: string }>
}

export type MeetingOccurrence<T extends MeetingLike = MeetingLike> = T & {
  occurrenceStart: Date
  occurrenceEnd: Date
  occurrenceKey: string
}

const weekdayMap: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value)
}

function getOccurrenceEnd(start: Date, originalStart: Date, originalEnd: Date) {
  return new Date(start.getTime() + (originalEnd.getTime() - originalStart.getTime()))
}

export function getMeetingRecurrenceLabel(recurrence?: RecurrenceConfig | null) {
  if (!recurrence?.enabled || !recurrence.frequency) {
    return "One-time"
  }

  let base: string
  if (recurrence.frequency === "DAILY" && recurrence.weekdays?.length === 5) {
    base = "Weekday recurring"
  } else if (recurrence.frequency === "DAILY") {
    base = "Daily recurring"
  } else {
    base = "Weekly recurring"
  }

  if (recurrence.until) {
    const u = toDate(recurrence.until)
    return `${base} · until ${format(u, "MMM d, yyyy")}`
  }

  return base
}

export function getNextMeetingOccurrence<T extends MeetingLike>(
  meeting: T,
  afterDate = new Date()
): MeetingOccurrence<T> | null {
  if (meeting.status === "CANCELLED") {
    return null
  }

  const start = toDate(meeting.startTime)
  const end = toDate(meeting.endTime)
  const recurrence = meeting.recurrence

  /** One-time: include only if the occurrence has not ended yet (same calendar day is not enough). */
  if (!recurrence?.enabled || !recurrence.frequency) {
    if (isAfter(end, afterDate)) {
      return {
        ...meeting,
        occurrenceStart: start,
        occurrenceEnd: end,
        occurrenceKey: `${meeting.id}:${start.toISOString()}`
      }
    }

    return null
  }

  const until = recurrence.until ? toDate(recurrence.until) : null
  const interval = recurrence.interval || 1
  let cursor = new Date(start)
  let guard = 0

  while (guard < 500) {
    guard += 1

    const includeWeekday =
      !recurrence.weekdays?.length ||
      recurrence.weekdays.some((weekday) => weekdayMap[weekday] === cursor.getDay())

    if (includeWeekday) {
      const occurrenceEnd = getOccurrenceEnd(cursor, start, end)
      /** Next occurrence = first slot that has not ended yet (skips today's meeting if it's already over). */
      if (isAfter(occurrenceEnd, afterDate) && (!until || !isAfter(cursor, until))) {
        return {
          ...meeting,
          occurrenceStart: cursor,
          occurrenceEnd,
          occurrenceKey: `${meeting.id}:${cursor.toISOString()}`
        }
      }
    }

    if (recurrence.frequency === "DAILY") {
      cursor = addDays(cursor, interval)
    } else {
      cursor = addDays(cursor, 1)
      if (recurrence.weekdays?.length === 0 && cursor.getDay() === start.getDay()) {
        cursor = addWeeks(cursor, interval - 1)
      }
    }

    if (until && isAfter(cursor, until)) {
      return null
    }
  }

  return null
}

export function getMeetingOccurrencesBetween<T extends MeetingLike>(
  meetings: T[],
  rangeStart: Date,
  rangeEnd: Date,
  limitPerMeeting = 60
) {
  const occurrences: Array<MeetingOccurrence<T>> = []

  for (const meeting of meetings) {
    if (meeting.status === "CANCELLED") {
      continue
    }

    const start = toDate(meeting.startTime)
    const end = toDate(meeting.endTime)
    const recurrence = meeting.recurrence

    if (!recurrence?.enabled || !recurrence.frequency) {
      if (
        (isAfter(start, rangeStart) || isSameDay(start, rangeStart)) &&
        (isBefore(start, rangeEnd) || isSameDay(start, rangeEnd))
      ) {
        occurrences.push({
          ...meeting,
          occurrenceStart: start,
          occurrenceEnd: end,
          occurrenceKey: `${meeting.id}:${start.toISOString()}`
        })
      }
      continue
    }

    const until = recurrence.until ? toDate(recurrence.until) : null
    const interval = recurrence.interval || 1
    let cursor = new Date(start)
    let count = 0

    while (count < limitPerMeeting) {
      count += 1

      const includeWeekday =
        !recurrence.weekdays?.length ||
        recurrence.weekdays.some((weekday) => weekdayMap[weekday] === cursor.getDay())

      if (
        includeWeekday &&
        (isAfter(cursor, rangeStart) || isSameDay(cursor, rangeStart)) &&
        (isBefore(cursor, rangeEnd) || isSameDay(cursor, rangeEnd))
      ) {
        occurrences.push({
          ...meeting,
          occurrenceStart: cursor,
          occurrenceEnd: getOccurrenceEnd(cursor, start, end),
          occurrenceKey: `${meeting.id}:${cursor.toISOString()}`
        })
      }

      if (recurrence.frequency === "DAILY") {
        cursor = addDays(cursor, interval)
      } else {
        cursor = addDays(cursor, 1)
        if (recurrence.weekdays?.length === 0 && cursor.getDay() === start.getDay()) {
          cursor = addWeeks(cursor, interval - 1)
        }
      }

      if ((until && isAfter(cursor, until)) || isAfter(cursor, rangeEnd)) {
        break
      }
    }
  }

  return occurrences.sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime())
}
