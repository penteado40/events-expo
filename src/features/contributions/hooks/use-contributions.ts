import { useQuery } from '@tanstack/react-query'

import { sortContributions } from '@/shared/domain/contributions'
import { canSeeGuests, type GuestDataScope } from '@/shared/domain/events'
import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { contributionsRepository } from '../api'
import type { Contribution } from '../schemas'

/**
 * An Event's Contributions marked paid, in Conferir's order (`PAID` first). Never requested when
 * the viewer can't see the Event's Guests (an archived Event's Manager or Viewer): the query stays
 * idle, without data.
 */
export const useContributions = (event: { id: number } & GuestDataScope) =>
  useQuery<Contribution[], ApiError>({
    queryKey: eventCollectionKey(event.id, 'contributions'),
    queryFn: () => contributionsRepository.list(event.id),
    enabled: canSeeGuests(event),
    select: sortContributions,
  })
