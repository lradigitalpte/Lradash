export enum MonitorType {
  WEBSITE = "WEBSITE",
  EMAIL = "EMAIL",
  SMTP = "SMTP",
  SSL = "SSL",
  DOMAIN = "DOMAIN",
  PORT = "PORT",
  SUBSCRIPTION = "SUBSCRIPTION"
}

export enum MonitorStatus {
  UP = "UP",
  DOWN = "DOWN",
  PENDING = "PENDING",
  EXPIRED = "EXPIRED",
  WARNING = "WARNING"
}

export interface IMonitor {
  _id?: string
  userId: string
  name: string
  type: MonitorType
  target: string // URL, IP, or Email Server address
  status: MonitorStatus
  lastChecked?: Date
  nextCheck?: Date
  lastUp?: Date
  lastDown?: Date
  responseTime?: number // in ms
  expiryDate?: Date // For SSL, Domain, Subscriptions
  price?: number // For Subscriptions
  currency?: string // For Subscriptions
  frequency: number // in minutes
  port?: number // For SMTP, PORT monitors (default 25 for SMTP, 80 for PORT)
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}
