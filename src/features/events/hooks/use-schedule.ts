import { useQuery } from '@tanstack/react-query'

import { scheduleRepository } from '../api'

export const scheduleQueryKey = (eventId: number) => ['events', eventId, 'schedule'] as const

/**
 * The Event's whole schedule (`GET /events/:id/schedule`), for an Owner or the Super admin: the API
 * refuses a Viewer for now, so `enabled` stays off for them.
 */
export function useSchedule(eventId: number, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: scheduleQueryKey(eventId),
    queryFn: () => scheduleRepository.get(eventId),
    enabled,
  })
}
