export interface MentionTarget {
  userId: string
  userName: string
}

export function normalizeMentionTargets(
  mentions: Array<Partial<MentionTarget> | null | undefined>
): MentionTarget[] {
  const dedupedMentions = new Map<string, MentionTarget>()

  for (const mention of mentions) {
    const userId = mention?.userId?.trim()
    if (!userId || dedupedMentions.has(userId)) {
      continue
    }

    dedupedMentions.set(userId, {
      userId,
      userName: mention?.userName?.trim() || ""
    })
  }

  return Array.from(dedupedMentions.values())
}

export function getNewMentionTargets(
  previousMentions: Array<Partial<MentionTarget> | null | undefined>,
  nextMentions: Array<Partial<MentionTarget> | null | undefined>
): MentionTarget[] {
  const previousMentionIds = new Set(
    normalizeMentionTargets(previousMentions).map((mention) => mention.userId)
  )

  return normalizeMentionTargets(nextMentions).filter(
    (mention) => !previousMentionIds.has(mention.userId)
  )
}
