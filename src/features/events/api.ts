import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { useSession } from '@/shared/session'

import { createMockEventsRepository } from './mock'
import type { EventsRepository } from './repository'
import { eventListSchema, eventSchema } from './schemas'

export type { EventsRepository } from './repository'

export function createHttpEventsRepository(http: HttpClient): EventsRepository {
  return {
    list: () => http.get('/events', { schema: eventListSchema }),
    get: (id) => http.get(`/events/${id}`, { schema: eventSchema }),
  }
}

/** The feature's only door to its data. `events` joins LIVE_MODULES once PROJ-67 lands. */
export const eventsRepository = selectRepository<EventsRepository>('events', {
  http: createHttpEventsRepository(apiClient),
  mock: createMockEventsRepository({
    getRequester: () => useSession.getState().session?.user ?? null,
  }),
})
