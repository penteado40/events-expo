import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { useCallback } from 'react'

import { sortEvents } from '@/shared/domain/events'
import type { ApiError } from '@/shared/lib/api-error'
import { eventKey, eventsKey } from '@/shared/lib/query-keys'

import { eventsRepository } from '../api'
import type { Event } from '../schemas'

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

/**
 * Coming back to a screen refetches the Events list if it is stale (older than `staleTime`); a
 * fetch already on its way is kept.
 */
export function useRefetchEventsOnFocus() {
  const client = useQueryClient()
  useFocusEffect(
    useCallback(() => {
      const stale = { queryKey: eventsKey, exact: true, stale: true }
      void client.refetchQueries(stale, { cancelRefetch: false })
    }, [client]),
  )
}
