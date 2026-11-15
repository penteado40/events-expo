import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import { groupMemberSchema } from '@/shared/domain/group-member'
import { teamSchema } from '@/shared/domain/team'

import {
  createMockEventItemsRepository,
  createMockEventsRepository,
  createMockGroupPeopleRepository,
  createMockParticipantsRepository,
  createMockScheduleRepository,
} from './mock'
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

export type {
  EventChanges,
  EventInput,
  EventItemChanges,
  EventItemInput,
  EventItemsRepository,
  EventsRepository,
  GroupPeopleRepository,
  ItemFieldChanges,
  ItemFieldInput,
  ItemPlaceInput,
  ParticipantsFrom,
  ParticipantsRepository,
  ScheduleRepository,
} from './repository'
export type {
  Event,
  EventItem,
  ItemField,
  ItemPlace,
  ItemWhen,
  Participant,
  Schedule,
} from './schemas'
export type { GroupMember } from '@/shared/domain/group-member'
export type { Team } from '@/shared/domain/team'

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
    publish: (eventId, itemId) =>
      http.post(`/events/${eventId}/items/${itemId}/publish`, { schema: eventItemSchema }),
    cancel: (eventId, itemId) =>
      http.post(`/events/${eventId}/items/${itemId}/cancel`, { schema: eventItemSchema }),
    uncancel: (eventId, itemId) =>
      http.post(`/events/${eventId}/items/${itemId}/uncancel`, { schema: eventItemSchema }),
    addField: (eventId, itemId, input) =>
      http.post(`/events/${eventId}/items/${itemId}/fields`, {
        body: input,
        schema: itemFieldSchema,
      }),
    updateField: (eventId, itemId, fieldId, changes) =>
      http.patch(`/events/${eventId}/items/${itemId}/fields/${fieldId}`, {
        body: changes,
        schema: itemFieldSchema,
      }),
    removeField: (eventId, itemId, fieldId) =>
      http.send('DELETE', `/events/${eventId}/items/${itemId}/fields/${fieldId}`),
    orderFields: (eventId, itemId, fieldIds) =>
      http.send('PUT', `/events/${eventId}/items/${itemId}/fields/order`, { body: { fieldIds } }),
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

export function createHttpParticipantsRepository(http: HttpClient): ParticipantsRepository {
  return {
    // PROJ-186 and PROJ-190 are not built in the events-api yet: these routes answer 404 there.
    available: () => false,
    list: (eventId) =>
      http.get(`/events/${eventId}/participants`, { schema: z.array(participantSchema) }),
    add: (eventId, userId) => http.send('PUT', `/events/${eventId}/participants/${userId}`),
    remove: (eventId, userId) => http.send('DELETE', `/events/${eventId}/participants/${userId}`),
  }
}

export function createHttpGroupPeopleRepository(http: HttpClient): GroupPeopleRepository {
  return {
    listMembers: (groupId) =>
      http.get(`/groups/${groupId}/members`, { schema: z.array(groupMemberSchema) }),
    listTeams: (groupId) => http.get(`/groups/${groupId}/teams`, { schema: z.array(teamSchema) }),
  }
}

/** An Event's Participants (the `events` module). */
export const participantsRepository = selectRepository<ParticipantsRepository>('events', {
  http: createHttpParticipantsRepository(apiClient),
  mock: createMockParticipantsRepository(),
})

/** The Group's people and Teams, read as the groups feature reads them (the `groups` module). */
export const groupPeopleRepository = selectRepository<GroupPeopleRepository>('groups', {
  http: createHttpGroupPeopleRepository(apiClient),
  mock: createMockGroupPeopleRepository(),
})
