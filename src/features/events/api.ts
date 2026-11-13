import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import { createMockEventsRepository } from './mock'
import type { EventsRepository } from './repository'
import { eventSchema } from './schemas'

export type { EventChanges, EventInput, EventsRepository } from './repository'
export type { Event } from './schemas'

export function createHttpEventsRepository(http: HttpClient): EventsRepository {
  return {
    listByGroup: (groupId) =>
      http.get(`/groups/${groupId}/events`, { schema: z.array(eventSchema) }),
    create: (groupId, input) =>
      http.post(`/groups/${groupId}/events`, { body: input, schema: eventSchema }),
    get: (eventId) => http.get(`/events/${eventId}`, { schema: eventSchema }),
    update: (eventId, changes) =>
      http.patch(`/events/${eventId}`, { body: changes, schema: eventSchema }),
  }
}

/** The feature's only door to its data. */
export const eventsRepository = selectRepository<EventsRepository>('events', {
  http: createHttpEventsRepository(apiClient),
  mock: createMockEventsRepository(),
})
