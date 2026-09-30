import { useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { rsvpsRepository } from '../api'
import type { Rsvp } from '../schemas'

/** An Event's RSVPs. */
export const useRsvps = (eventId: number) =>
  useQuery<Rsvp[], ApiError>({
    queryKey: eventCollectionKey(eventId, 'rsvps'),
    queryFn: () => rsvpsRepository.list(eventId),
  })
