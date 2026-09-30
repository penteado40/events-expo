import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { useSession } from '@/shared/session'

import { createMockContributionsRepository } from './mock'
import type { ContributionsRepository } from './repository'
import { contributionListSchema } from './schemas'

export type { ContributionsRepository } from './repository'

export function createHttpContributionsRepository(http: HttpClient): ContributionsRepository {
  return {
    list: (eventId) =>
      http.get(`/events/${eventId}/contributions`, { schema: contributionListSchema }),
  }
}

/** The feature's only door to its data. `contributions` joins LIVE_MODULES with events-api #17. */
export const contributionsRepository = selectRepository<ContributionsRepository>('contributions', {
  http: createHttpContributionsRepository(apiClient),
  mock: createMockContributionsRepository({
    getRequester: () => useSession.getState().session?.user ?? null,
  }),
})
