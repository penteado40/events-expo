import { useQuery } from '@tanstack/react-query'

import { canSeeGuests, type GuestDataScope } from '@/shared/domain/events'
import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { rsvpsRepository } from '../api'
import { sortRsvps } from '../rsvp-order'
import type { Rsvp } from '../schemas'

/**
 * An Event's RSVPs, most recent first. Never requested when the viewer can't see the Event's
 * Guests (an archived Event's Manager or Viewer): the query stays idle, without data.
 */
export const useRsvps = (event: { id: number } & GuestDataScope) =>
  useQuery<Rsvp[], ApiError>({
    queryKey: eventCollectionKey(event.id, 'rsvps'),
    queryFn: () => rsvpsRepository.list(event.id),
    enabled: canSeeGuests(event),
    select: sortRsvps,
  })
