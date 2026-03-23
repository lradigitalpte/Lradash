export type UptimeBarStatus = "UP" | "DOWN" | "WARNING" | "NONE"

function mapStatusString(s: string | undefined | null): UptimeBarStatus {
  const v = String(s ?? "").toUpperCase()
  if (v === "UP") {
    return "UP"
  }
  if (v === "DOWN") {
    return "DOWN"
  }
  if (v === "WARNING") {
    return "WARNING"
  }
  return "NONE"
}

/**
 * Converts UptimeRobot uptime stats response into UptimeStatusBars-friendly statuses.
 *
 * UR response shapes can differ; we handle common patterns:
 * - lastDayUptimes.histogram: [number | string | {status: string}]
 * - histogram: [...]
 */
export function uptimeStatsToBars(stats: any): UptimeBarStatus[] | null {
  if (!stats) {
    return null
  }

  function findHistogramDeep(input: any, depth: number = 0): any[] | null {
    if (!input || typeof input !== "object") {
      return null
    }
    if (depth > 6) {
      return null
    }

    if (Array.isArray(input)) {
      return null
    }

    for (const [key, value] of Object.entries(input)) {
      if (key.toLowerCase().includes("histogram") && Array.isArray(value)) {
        return value
      }
      const nested = findHistogramDeep(value, depth + 1)
      if (nested) {
        return nested
      }
    }
    return null
  }

  const histogram =
    stats?.lastDayUptimes?.histogram ??
    stats?.lastDayUptimes?.hist ?? // just in case
    stats?.histogram ??
    stats?.data?.histogram ??
    findHistogramDeep(stats) ??
    null

  if (!Array.isArray(histogram) || histogram.length === 0) {
    return null
  }

  const bars: UptimeBarStatus[] = histogram.map((entry: any) => {
    if (entry == null) {
      return "NONE"
    }

    if (typeof entry === "string") {
      // Sometimes UR may provide already-mapped strings
      if (entry.toUpperCase().includes("UP")) {
        return "UP"
      }
      if (entry.toUpperCase().includes("DOWN")) {
        return "DOWN"
      }
      if (entry.toUpperCase().includes("WARN")) {
        return "WARNING"
      }
      return "NONE"
    }

    if (typeof entry === "number") {
      // Heuristic: uptime ratio > 0 means operational
      return entry <= 0 ? "DOWN" : "UP"
    }

    if (typeof entry === "object") {
      // Might be { status: "UP" } or { uptime: 1 }
      const status = mapStatusString(entry.status)
      if (status !== "NONE") {
        return status
      }

      if (typeof entry.uptime === "number") {
        return entry.uptime <= 0 ? "DOWN" : "UP"
      }
      if (typeof entry.value === "number") {
        return entry.value <= 0 ? "DOWN" : "UP"
      }
    }

    return "NONE"
  })

  // If too long, keep the most recent tail.
  // UptimeStatusBars default tooltips assume 30-min buckets, but the visuals still work.
  if (bars.length > 48) {
    return bars.slice(-48)
  }
  return bars
}
