import { useQuery, useQueryClient } from '@tanstack/react-query'

import { sortEvents } from '@/shared/domain/events'
import type { ApiError } from '@/shared/lib/api-error'

import { eventsRepository } from '../api'
import type { Event } from '../schemas'

const eventsKey = ['events'] as const
const eventKey = (id: number) => ['events', id] as const

/** The Events the viewer can see, in the list's order (the app sorts, not the API). */
export function useEvents() {
  return useQuery<Event[], ApiError>({
    queryKey: eventsKey,
    queryFn: () => eventsRepository.list(),
    select: sortEvents,
  })
}

/** One Event. Shows the list's copy at once, if there is one, while it fetches its own. */
export function useEvent(id: number) {
  const client = useQueryClient()
  return useQuery<Event, ApiError>({
    queryKey: eventKey(id),
    queryFn: () => eventsRepository.get(id),
    placeholderData: () => client.getQueryData<Event[]>(eventsKey)?.find((e) => e.id === id),
  })
}
