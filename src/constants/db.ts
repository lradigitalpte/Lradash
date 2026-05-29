export const DB_CONNECT_TIMEOUT_MS = 10000
export const DB_SOCKET_TIMEOUT_MS = 45000
export const DB_SERVER_SELECTION_TIMEOUT_MS = 10000

const parseEnvNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const DB_MAX_POOL_SIZE = parseEnvNumber(process.env.DB_MAX_POOL_SIZE, 20)
export const DB_MIN_POOL_SIZE = parseEnvNumber(process.env.DB_MIN_POOL_SIZE, 1)
export const DB_MAX_IDLE_TIME_MS = parseEnvNumber(process.env.DB_MAX_IDLE_TIME_MS, 30000)
export const DB_WAIT_QUEUE_TIMEOUT_MS = parseEnvNumber(process.env.DB_WAIT_QUEUE_TIMEOUT_MS, 10000)
export const DB_AUTH_MAX_POOL_SIZE = parseEnvNumber(process.env.DB_AUTH_MAX_POOL_SIZE, 10)
