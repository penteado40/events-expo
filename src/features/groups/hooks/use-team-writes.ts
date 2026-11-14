import { useMutation, useQueryClient } from '@tanstack/react-query'

import { groupsRepository, type Team } from '../api'
import { groupTeamsQueryKey } from './use-group-people'

/** Reloads the Group's Teams after a write, so every count and chip follows. */
function useRefreshTeams(groupId: number) {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: groupTeamsQueryKey(groupId) })
}

/** Creates a Team by name (PROJ-181), with nobody in it yet. */
export function useCreateTeam(groupId: number) {
  const refresh = useRefreshTeams(groupId)
  return useMutation<Team, unknown, string>({
    mutationFn: (name) => groupsRepository.createTeam(groupId, name),
    onSuccess: () => {
      void refresh()
    },
  })
}

/** Renames a Team (PROJ-181). */
export function useRenameTeam(groupId: number, teamId: number) {
  const refresh = useRefreshTeams(groupId)
  return useMutation<Team, unknown, string>({
    mutationFn: (name) => groupsRepository.renameTeam(groupId, teamId, name),
    onSuccess: refresh,
  })
}

/**
 * Deletes a Team (PROJ-181), then reloads the Teams without waiting: the reload drops it, so the
 * screen showing it must leave on its own (`mutateAsync`).
 */
export function useDeleteTeam(groupId: number, teamId: number) {
  const refresh = useRefreshTeams(groupId)
  return useMutation<void, unknown, void>({
    mutationFn: () => groupsRepository.deleteTeam(groupId, teamId),
    onSuccess: () => {
      void refresh()
    },
  })
}

/** Puts a Group member in the Team, or takes them out (PROJ-183, planned in the events-api). */
export function useTeamMembership(groupId: number, teamId: number) {
  const refresh = useRefreshTeams(groupId)
  const add = useMutation<void, unknown, number>({
    mutationFn: (userId) => groupsRepository.addTeamMember(groupId, teamId, userId),
    onSettled: refresh,
  })
  const remove = useMutation<void, unknown, number>({
    mutationFn: (userId) => groupsRepository.removeTeamMember(groupId, teamId, userId),
    onSettled: refresh,
  })
  return { add, remove }
}

/** Whether who is in a Team can change here: not over the events-api yet (PROJ-183). */
export const canEditTeamMembers = () => groupsRepository.editsTeamMembers()
