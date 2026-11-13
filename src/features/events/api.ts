import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import {
  createMockEventItemsRepository,
  createMockEventsRepository,
  createMockScheduleRepository,
} from './mock'
import type { EventItemsRepository, EventsRepository, ScheduleRepository } from './repository'
import { eventItemSchema, eventSchema, scheduleSchema } from './schemas'

export type {
  EventChanges,
  EventInput,
  EventItemChanges,
  EventItemInput,
  EventItemsRepository,
  EventsRepository,
  ItemPlaceInput,
  ScheduleRepository,
} from './repository'
export type { Event, EventItem, ItemPlace, ItemWhen, Schedule } from './schemas'

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

export function createHttpEventItemsRepository(http: HttpClient): EventItemsRepository {
  return {
    create: (eventId, input) =>
      http.post(`/events/${eventId}/items`, { body: input, schema: eventItemSchema }),
    update: (eventId, itemId, changes) =>
      http.patch(`/events/${eventId}/items/${itemId}`, { body: changes, schema: eventItemSchema }),
    remove: (eventId, itemId) => http.send('DELETE', `/events/${eventId}/items/${itemId}`),
  }
}

export function createHttpScheduleRepository(http: HttpClient): ScheduleRepository {
  return {
    get: (eventId) => http.get(`/events/${eventId}/schedule`, { schema: scheduleSchema }),
  }
}

/** Event items' writes (the `items` module). */
export const itemsRepository = selectRepository<EventItemsRepository>('items', {
  http: createHttpEventItemsRepository(apiClient),
  mock: createMockEventItemsRepository(),
})

/** The schedule's reading (the `schedule` module). */
export const scheduleRepository = selectRepository<ScheduleRepository>('schedule', {
  http: createHttpScheduleRepository(apiClient),
  mock: createMockScheduleRepository(),
})
