import { useMutation, useQueryClient } from '@tanstack/react-query'

import { groupsRepository, type ActivationLink, type AddedViewer, type NewViewer } from '../api'
import { groupMembersQueryKey, groupTeamsQueryKey } from './use-group-people'

/** The person added, and whether putting them in the chosen Teams failed (they are in the Group). */
export type AddViewerResult = AddedViewer & { teamsFailed: boolean }

/** Reloads who is in the Group and in its Teams after a write. */
function useRefreshPeople(groupId: number) {
  const client = useQueryClient()
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: groupMembersQueryKey(groupId) }),
      client.invalidateQueries({ queryKey: groupTeamsQueryKey(groupId) }),
    ])
}

/**
 * Adds a person as a Viewer (PROJ-177), then puts them in the chosen Teams one by one: the API's
 * adding takes no Teams, and Team members (PROJ-183) are not built in the events-api yet. A Team
 * that fails does not undo the adding.
 */
export function useAddViewer(groupId: number) {
  const refresh = useRefreshPeople(groupId)
  return useMutation<AddViewerResult, unknown, { viewer: NewViewer; teamIds: number[] }>({
    mutationFn: async ({ viewer, teamIds }) => {
      const added = await groupsRepository.addViewer(groupId, viewer)
      const results = await Promise.allSettled(
        teamIds.map((teamId) => groupsRepository.addTeamMember(groupId, teamId, added.userId)),
      )
      return { ...added, teamsFailed: results.some((r) => r.status === 'rejected') }
    },
    onSettled: refresh,
  })
}

/** A new Activation link for a pending Group member (PROJ-180); the previous one stops working. */
export function useReissueActivationLink(groupId: number) {
  return useMutation<ActivationLink, unknown, number>({
    mutationFn: (userId) => groupsRepository.reissueActivationLink(groupId, userId),
  })
}

/**
 * Takes a Viewer out of the Group (PROJ-179), then reloads the people without waiting: the reload
 * drops them from the list, so the screen showing them must leave on its own (`mutateAsync`).
 */
export function useRemoveViewer(groupId: number) {
  const refresh = useRefreshPeople(groupId)
  return useMutation<void, unknown, number>({
    mutationFn: (userId) => groupsRepository.removeViewer(groupId, userId),
    onSuccess: () => {
      void refresh()
    },
  })
}
