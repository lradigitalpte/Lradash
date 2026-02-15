import mongoose, { Model } from "mongoose"

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ["GENERAL", "ALERT", "MILESTONE", "TEAM", "SYSTEM"],
      default: "GENERAL"
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isPinned: { type: Boolean, default: false },
    tags: [{ type: String }],
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  {
    timestamps: true
  }
)

// Indexes
announcementSchema.index({ project: 1, createdAt: -1 })
announcementSchema.index({ organizationId: 1 })

// Check if model already exists to prevent overwrite error
let AnnouncementModel: Model<any>
try {
  AnnouncementModel = mongoose.model("Announcement")
} catch {
  AnnouncementModel = mongoose.model("Announcement", announcementSchema)
}

export { AnnouncementModel }
