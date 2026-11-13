import { z } from 'zod'

import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'

import type { EventItemsRepository, EventsRepository, ScheduleRepository } from './repository'
import { eventItemSchema, eventSchema, scheduleSchema } from './schemas'

type Options = { getEmail?: GetEmail; backend?: MockBackend }

/** EventsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockEventsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): EventsRepository {
  const identity = () => identityOf(getEmail)
  return {
    listByGroup: async (groupId) =>
      z.array(eventSchema).parse(await backend.groupEvents(await identity(), groupId)),
    create: async (groupId, input) =>
      eventSchema.parse(await backend.createEvent(await identity(), groupId, input)),
    get: async (eventId) => eventSchema.parse(await backend.event(await identity(), eventId)),
    update: async (eventId, changes) =>
      eventSchema.parse(await backend.updateEvent(await identity(), eventId, changes)),
  }
}

/** EventItemsRepository over the shared mock backend, answers validated like HTTP's. */
export function createMockEventItemsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): EventItemsRepository {
  const identity = () => identityOf(getEmail)
  return {
    create: async (eventId, input) =>
      eventItemSchema.parse(await backend.createItem(await identity(), eventId, input)),
    update: async (eventId, itemId, changes) =>
      eventItemSchema.parse(await backend.updateItem(await identity(), eventId, itemId, changes)),
    remove: async (eventId, itemId) => backend.deleteItem(await identity(), eventId, itemId),
  }
}

/** ScheduleRepository over the shared mock backend, answers validated like HTTP's. */
export function createMockScheduleRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): ScheduleRepository {
  return {
    get: async (eventId) =>
      scheduleSchema.parse(await backend.schedule(await identityOf(getEmail), eventId)),
  }
}
