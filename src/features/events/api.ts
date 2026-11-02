import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import { createMockEventsRepository } from './mock'
import type { EventsRepository } from './repository'
import { eventSchema } from './schemas'

export type { EventsRepository } from './repository'
export type { Event } from './schemas'

export function createHttpEventsRepository(http: HttpClient): EventsRepository {
  return {
    listByGroup: (groupId) =>
      http.get(`/groups/${groupId}/events`, { schema: z.array(eventSchema) }),
  }
}

/** The feature's only door to its data. */
export const eventsRepository = selectRepository<EventsRepository>('events', {
  http: createHttpEventsRepository(apiClient),
  mock: createMockEventsRepository(),
})
