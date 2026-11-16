import { z } from 'zod'

import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'

import { groupMemberSchema } from '@/shared/domain/group-member'
import { teamSchema } from '@/shared/domain/team'

import type {
  EventItemsRepository,
  EventsRepository,
  GroupPeopleRepository,
  ParticipantsRepository,
  ScheduleRepository,
} from './repository'
import {
  eventItemSchema,
  eventSchema,
  itemFieldSchema,
  participantSchema,
  scheduleSchema,
} from './schemas'

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
    peopleFieldsAvailable: () => true,
    highlightAvailable: () => true,
    personalNotesAvailable: () => true,
    audienceAvailable: () => true,
    create: async (eventId, input) =>
      eventItemSchema.parse(await backend.createItem(await identity(), eventId, input)),
    update: async (eventId, itemId, changes) =>
      eventItemSchema.parse(await backend.updateItem(await identity(), eventId, itemId, changes)),
    remove: async (eventId, itemId) => backend.deleteItem(await identity(), eventId, itemId),
    publish: async (eventId, itemId) =>
      eventItemSchema.parse(await backend.publishItem(await identity(), eventId, itemId)),
    cancel: async (eventId, itemId) =>
      eventItemSchema.parse(await backend.cancelItem(await identity(), eventId, itemId)),
    uncancel: async (eventId, itemId) =>
      eventItemSchema.parse(await backend.uncancelItem(await identity(), eventId, itemId)),
    addField: async (eventId, itemId, input) =>
      itemFieldSchema.parse(await backend.addField(await identity(), eventId, itemId, input)),
    updateField: async (eventId, itemId, fieldId, changes) =>
      itemFieldSchema.parse(
        await backend.updateField(await identity(), eventId, itemId, fieldId, changes),
      ),
    removeField: async (eventId, itemId, fieldId) =>
      backend.deleteField(await identity(), eventId, itemId, fieldId),
    orderFields: async (eventId, itemId, fieldIds) =>
      backend.orderFields(await identity(), eventId, itemId, { fieldIds }),
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

/** ParticipantsRepository over the shared mock backend, which has them as the events-api plans. */
export function createMockParticipantsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): ParticipantsRepository {
  const identity = () => identityOf(getEmail)
  return {
    available: () => true,
    list: async (eventId) =>
      z.array(participantSchema).parse(await backend.participants(await identity(), eventId)),
    add: async (eventId, userId) => backend.addParticipant(await identity(), eventId, userId),
    remove: async (eventId, userId) => backend.removeParticipant(await identity(), eventId, userId),
  }
}

/** GroupPeopleRepository over the shared mock backend, answers validated like HTTP's. */
export function createMockGroupPeopleRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): GroupPeopleRepository {
  const identity = () => identityOf(getEmail)
  return {
    listMembers: async (groupId) =>
      z.array(groupMemberSchema).parse(await backend.groupMembers(await identity(), groupId)),
    listTeams: async (groupId) =>
      z.array(teamSchema).parse(await backend.groupTeams(await identity(), groupId)),
  }
}
