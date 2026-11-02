import { useQuery } from '@tanstack/react-query'

import { eventsRepository } from '../api'

export const groupEventsQueryKey = (groupId: number) => ['groups', groupId, 'events'] as const

/** The Group's Events; refetched on return to the app once 30 s old (query client defaults). */
export function useGroupEvents(groupId: number) {
  return useQuery({
    queryKey: groupEventsQueryKey(groupId),
    queryFn: () => eventsRepository.listByGroup(groupId),
  })
}
