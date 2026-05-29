import { getNewMentionTargets, normalizeMentionTargets } from "@/lib/notifications/mentions"

describe("mention helpers", () => {
  it("normalizes and deduplicates mention targets", () => {
    expect(
      normalizeMentionTargets([
        { userId: " user-1 ", userName: " Alice " },
        { userId: "user-1", userName: "Alice Duplicate" },
        { userId: "user-2" },
        { userId: "   ", userName: "Ignored" },
        null,
        undefined
      ])
    ).toEqual([
      { userId: "user-1", userName: "Alice" },
      { userId: "user-2", userName: "" }
    ])
  })

  it("returns only mentions newly added on comment edit", () => {
    expect(
      getNewMentionTargets(
        [
          { userId: "user-1", userName: "Alice" },
          { userId: "user-2", userName: "Bob" }
        ],
        [
          { userId: "user-2", userName: "Bob" },
          { userId: "user-3", userName: "Cara" },
          { userId: "user-3", userName: "Cara Duplicate" }
        ]
      )
    ).toEqual([{ userId: "user-3", userName: "Cara" }])
  })
})