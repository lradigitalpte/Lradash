import mongoose, { Model } from "mongoose"

import {
  Meeting as MeetingType,
  MeetingRecurrenceFrequency,
  MeetingStatus
} from "@/types/dbInterface"

const meetingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null
    },
    organizerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    googleAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoogleWorkspaceAccount",
      required: true
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(MeetingStatus),
      default: MeetingStatus.SCHEDULED
    },
    calendarEventId: { type: String, required: true },
    calendarHtmlLink: { type: String },
    meetUri: { type: String },
    meetCode: { type: String },
    recurrence: {
      enabled: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: Object.values(MeetingRecurrenceFrequency)
      },
      interval: { type: Number, default: 1 },
      weekdays: [{ type: String }],
      until: { type: Date, default: null }
    },
    attendees: [
      {
        email: { type: String, required: true },
        name: { type: String },
        responseStatus: {
          type: String,
          enum: ["needsAction", "declined", "tentative", "accepted"],
          default: "needsAction"
        }
      }
    ],
    cancelledAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
)

meetingSchema.index({ organizationId: 1, startTime: 1 })
meetingSchema.index({ organizationId: 1, status: 1, startTime: 1 })
meetingSchema.index({ organizerUserId: 1, startTime: 1 })
meetingSchema.index({ calendarEventId: 1, organizationId: 1 }, { unique: true })
meetingSchema.index({ projectId: 1, startTime: 1 })

let MeetingModel: Model<MeetingType>

try {
  MeetingModel = mongoose.model<MeetingType>("Meeting")
} catch {
  MeetingModel = mongoose.model<MeetingType>("Meeting", meetingSchema)
}

export { MeetingModel }
