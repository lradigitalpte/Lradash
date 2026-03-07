import mongoose, { Model, Schema } from "mongoose"

import { ICostLineItem, CostLineItemType, CostFrequency } from "@/types/cost-line-item"

const costLineItemSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: Object.values(CostLineItemType),
      required: true
    },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    frequency: {
      type: String,
      enum: Object.values(CostFrequency),
      required: true
    },
    dueDate: { type: Date },
    expiryDate: { type: Date },
    monitorId: { type: Schema.Types.ObjectId, ref: "Monitor" },
    notes: { type: String }
  },
  { timestamps: true }
)

costLineItemSchema.index({ projectId: 1, createdAt: -1 })

const CostLineItemModel: Model<ICostLineItem> =
  mongoose.models.CostLineItem || mongoose.model<ICostLineItem>("CostLineItem", costLineItemSchema)

export default CostLineItemModel
