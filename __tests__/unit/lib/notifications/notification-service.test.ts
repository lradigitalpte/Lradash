import { Types } from "mongoose"

import { connectToDatabase } from "@/lib/db/connect"
import { dispatchNotification } from "@/lib/notifications/dispatcher"
import { sendMentionNotifications } from "@/lib/notifications/notification-service"
import { UserModel } from "@/models/user.model"

vi.mock("@/lib/db/connect")
vi.mock("@/lib/notifications/dispatcher")
vi.mock("@/models/user.model")

describe("sendMentionNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(connectToDatabase as jest.Mock).mockResolvedValue(undefined)
  })

  it("suppresses mention email delivery when email notifications are disabled", async () => {
    const recipientId = new Types.ObjectId()
    const select = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: recipientId,
        name: "Recipient User",
        email: "recipient@example.com",
        notificationEmail: "alt@example.com",
        preferences: { emailNotifications: false }
      })
    })

    ;(UserModel.findById as jest.Mock).mockReturnValue({ select })

    await sendMentionNotifications({
      userId: recipientId.toHexString(),
      type: "mention",
      taskId: "task-1",
      commentId: "comment-1",
      mentionedByUser: {
        id: new Types.ObjectId().toHexString(),
        name: "Mention Author",
        email: "author@example.com"
      },
      taskTitle: "Task title",
      commentText: "Ping @recipient",
      methods: ["in-app", "email"]
    })

    expect(UserModel.findById).toHaveBeenCalledWith(recipientId.toHexString())
    expect(dispatchNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: recipientId.toHexString(),
        type: "mention",
        email: undefined
      })
    )
  })
})