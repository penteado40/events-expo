import { useQuery } from '@tanstack/react-query'

import { eventsRepository } from '../api'

export const eventQueryKey = (eventId: number) => ['events', eventId] as const

/** One Event, where and when (`GET /events/:id`). */
export function useEvent(eventId: number) {
  return useQuery({
    queryKey: eventQueryKey(eventId),
    queryFn: () => eventsRepository.get(eventId),
  })
}
