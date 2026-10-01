import { useQuery } from '@tanstack/react-query'

import type { ApiError } from '@/shared/lib/api-error'
import { eventCollectionKey } from '@/shared/lib/query-keys'

import { registryRepository } from '../api'
import type { RegistryItem } from '../schemas'

/** An Event's Registry items, in the API's order (the Owners' curation). */
export const useRegistryItems = (eventId: number) =>
  useQuery<RegistryItem[], ApiError>({
    queryKey: eventCollectionKey(eventId, 'registry'),
    queryFn: () => registryRepository.list(eventId),
  })
