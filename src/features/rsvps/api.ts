import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { useSession } from '@/shared/session'

import { createMockRsvpsRepository } from './mock'
import type { RsvpsRepository } from './repository'
import { rsvpListSchema } from './schemas'

export type { RsvpsRepository } from './repository'

export function createHttpRsvpsRepository(http: HttpClient): RsvpsRepository {
  return {
    list: (eventId) => http.get(`/events/${eventId}/rsvps`, { schema: rsvpListSchema }),
  }
}

/** The feature's only door to its data. `rsvps` joins LIVE_MODULES with events-api #10. */
export const rsvpsRepository = selectRepository<RsvpsRepository>('rsvps', {
  http: createHttpRsvpsRepository(apiClient),
  mock: createMockRsvpsRepository({
    getRequester: () => useSession.getState().session?.user ?? null,
  }),
})
