import { useQuery } from '@tanstack/react-query'

import { groupsRepository } from '../api'

export const groupMembersQueryKey = (groupId: number) => ['groups', groupId, 'members'] as const
export const groupTeamsQueryKey = (groupId: number) => ['groups', groupId, 'teams'] as const

/** Who is in the Group. */
export function useGroupMembers(groupId: number) {
  return useQuery({
    queryKey: groupMembersQueryKey(groupId),
    queryFn: () => groupsRepository.listMembers(groupId),
  })
}

/** The Group's Teams. */
export function useGroupTeams(groupId: number) {
  return useQuery({
    queryKey: groupTeamsQueryKey(groupId),
    queryFn: () => groupsRepository.listTeams(groupId),
  })
}
