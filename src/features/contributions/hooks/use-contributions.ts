import { useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { contributionsRepository } from '../api'
import type { Contribution } from '../schemas'

/** An Event's Contributions marked paid. */
export const useContributions = (eventId: number) =>
  useQuery<Contribution[], ApiError>({
    queryKey: eventCollectionKey(eventId, 'contributions'),
    queryFn: () => contributionsRepository.list(eventId),
  })
