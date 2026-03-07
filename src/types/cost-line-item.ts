export enum CostLineItemType {
  SSL = "SSL",
  DOMAIN = "DOMAIN",
  SUBSCRIPTION = "SUBSCRIPTION",
  META_ADS = "META_ADS",
  OTHER = "OTHER"
}

export enum CostFrequency {
  ONE_TIME = "ONE_TIME",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  ANNUAL = "ANNUAL"
}

export interface ICostLineItem {
  _id?: string
  projectId: string
  organizationId: string
  type: CostLineItemType
  name: string
  amount: number
  currency: string
  frequency: CostFrequency
  dueDate?: Date
  expiryDate?: Date
  monitorId?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}
