import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { useSession } from '@/shared/session'

import { createMockRegistryRepository } from './mock'
import type { RegistryRepository } from './repository'
import { registryItemListSchema } from './schemas'

export type { RegistryRepository } from './repository'

export function createHttpRegistryRepository(http: HttpClient): RegistryRepository {
  return {
    list: (eventId) =>
      http.get(`/events/${eventId}/registry-items`, { schema: registryItemListSchema }),
  }
}

/** The feature's only door to its data. `registry` joins LIVE_MODULES with events-api #13. */
export const registryRepository = selectRepository<RegistryRepository>('registry', {
  http: createHttpRegistryRepository(apiClient),
  mock: createMockRegistryRepository({
    getRequester: () => useSession.getState().session?.user ?? null,
  }),
})
