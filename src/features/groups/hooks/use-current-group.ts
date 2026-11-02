import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useSession } from '@/shared/session'

import { groupsRepository } from '../api'
import { resolveCurrentGroup } from '../current-group'
import { useGroupChoice } from '../group-choice-store'

export const groupsQueryKey = ['groups'] as const

/**
 * The person's Groups and the one the Início shows, as chosen on this device (remembered per
 * User), with their role there. `group` is null while loading, on error, and when they are in no
 * Group.
 */
export function useCurrentGroup() {
  const user = useSession((state) => state.session?.user)
  const choiceLoaded = useGroupChoice((state) => state.hydrated)
  const chosenId = useGroupChoice((state) => (user ? (state.chosenBy[user.id] ?? null) : null))
  const query = useQuery({ queryKey: groupsQueryKey, queryFn: () => groupsRepository.list() })

  const groups = query.data ?? []
  const group = user ? resolveCurrentGroup(groups, chosenId, user) : null
  /** Each Group with the person's role there, for the "Seus Groups" sheet. */
  const options = user ? groups.map((g) => resolveCurrentGroup(groups, g.id, user)!) : []

  const choose = useCallback(
    (groupId: number) => {
      if (user) useGroupChoice.getState().choose(user.id, groupId)
    },
    [user],
  )

  return {
    /** Waiting for the Groups or for the remembered choice, so the Início never flips Groups. */
    loading: query.isPending || !choiceLoaded,
    error: query.error,
    group,
    options,
    choose,
    refetch: query.refetch,
  }
}
