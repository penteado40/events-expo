import { useQuery } from '@tanstack/react-query'

import { groupMembersQueryKey, groupTeamsQueryKey } from '@/shared/lib/group-query-keys'

import { groupsRepository } from '../api'

export { groupMembersQueryKey, groupTeamsQueryKey }

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
