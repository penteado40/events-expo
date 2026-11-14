/**
 * The cache keys of a Group's members and Teams, read by the groups feature and by the events
 * feature (choosing Participants) over the same routes: one key, so both share one cache and a
 * Team write refreshes both.
 */
export const groupMembersQueryKey = (groupId: number) => ['groups', groupId, 'members'] as const
export const groupTeamsQueryKey = (groupId: number) => ['groups', groupId, 'teams'] as const
