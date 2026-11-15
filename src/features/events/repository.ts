import type { GroupMember } from '@/shared/domain/group-member'
import type { Team } from '@/shared/domain/team'
import type { LocalDate, LocalTime, Period } from '@/shared/domain/local-dates'

import type { Event, EventItem, ItemField, Participant, Schedule } from './schemas'

/** A new Event's Participants as a copy of who is in these Teams (events-api PROJ-189). */
export type ParticipantsFrom = { teamIds: number[] }

/**
 * Where and when of an Event, as the Owner writes it (events-api PROJ-182), and, creating it, where
 * its Participants come from: left out, every Group member (PROJ-186).
 */
export type EventInput = {
  name: string
  place: string
  period: Period
  participantsFrom?: ParticipantsFrom
}

/** An edit: what is left out stays; the period goes whole. The Participants change on their own. */
export type EventChanges = Partial<Omit<EventInput, 'participantsFrom'>>

/** Mirrors the events-api's `events` module. */
export interface EventsRepository {
  /** The Group's Events by start date. `NOT_FOUND` for someone outside the Group. */
  listByGroup(groupId: number): Promise<Event[]>
  /**
   * `POST /groups/:id/events`: an Owner (or the Super admin) creates the Event, born in Draft, with
   * its Participants copied from the Group or from `participantsFrom`'s Teams. A Team of another
   * Group is `NOT_FOUND`, no Team at all `VALIDATION_ERROR`. `EVENT_PERIOD_INVALID` for an end
   * before the start; `VALIDATION_ERROR` names any other field in its details; `FORBIDDEN` for a
   * Viewer; `NOT_FOUND` outside the Group.
   */
  create(groupId: number, input: EventInput): Promise<Event>
  /** `GET /events/:id`: any Group member reads it. `NOT_FOUND` outside the Group. */
  get(eventId: number): Promise<Event>
  /**
   * `PATCH /events/:id`: an Owner edits name, place and period, a Finished event too. Errors as
   * `create`.
   */
  update(eventId: number, changes: EventChanges): Promise<Event>
}

/**
 * Mirrors the events-api's Participants of an Event (PROJ-186, PROJ-190), not built there yet: the
 * HTTP implementation follows the planned routes.
 */
export interface ParticipantsRepository {
  /**
   * Whether the Participants can be read and changed here, and chosen when creating an Event.
   * False over HTTP until the events-api has them: screens then show no Participants at all.
   */
  available(): boolean
  /** `GET /events/:id/participants`: any Group member reads it. `NOT_FOUND` outside the Group. */
  list(eventId: number): Promise<Participant[]>
  /**
   * `PUT /events/:id/participants/:userId`, no body: an Owner adds a Group member; already going,
   * nothing changes. `NOT_FOUND` for someone outside the Group; `EVENT_CANCELLED` while the Event
   * is Cancelled; `FORBIDDEN` for a Viewer.
   */
  add(eventId: number, userId: number): Promise<void>
  /**
   * `DELETE /events/:id/participants/:userId`: takes someone out; they stop seeing the items and
   * stay in the Fields of people marked as out of the Event. `NOT_FOUND` for someone not going;
   * otherwise as `add`.
   */
  remove(eventId: number, userId: number): Promise<void>
}

/**
 * The Group's people as choosing Participants needs them: the same `GET /groups/:id/members` and
 * `GET /groups/:id/teams` the groups feature reads (features do not import each other, ADR-0001).
 */
export interface GroupPeopleRepository {
  listMembers(groupId: number): Promise<GroupMember[]>
  listTeams(groupId: number): Promise<Team[]>
}

/** A place as the Owner writes it: each part optional, but not all empty. */
export type ItemPlaceInput = {
  name?: string | null
  address?: string | null
  timezone?: string | null
}

/**
 * An Event item as the Owner writes it (events-api PROJ-187): the date and the time are local and
 * optional, the time only with a date; the place is optional and, without a zone, the Event's applies.
 */
export type EventItemInput = {
  name: string
  date?: LocalDate | null
  time?: LocalTime | null
  place?: ItemPlaceInput | null
}

/** An edit: what is left out stays, `null` clears it; the place goes whole. */
export type EventItemChanges = Partial<EventItemInput>

/** A text Field as the Owner writes it (events-api PROJ-198): the Highlight is off unless asked. */
export type ItemFieldInput = { type: 'TEXT'; name: string; value: string; highlight?: boolean }

/** An edit of a Field: what is left out stays; its type never changes. */
export type ItemFieldChanges = Partial<Omit<ItemFieldInput, 'type'>>

/** Mirrors the events-api's Event item writes (`/events/:id/items`). */
export interface EventItemsRepository {
  /**
   * `POST /events/:id/items`: an Owner (or the Super admin) creates the item, born published in a
   * Draft Event and in Draft in a published one (PROJ-194). `EVENT_ITEM_TIME_WITHOUT_DATE` for a
   * time with no date; `VALIDATION_ERROR` for a blank name or an empty place; `EVENT_CANCELLED`
   * while the Event is Cancelled; `FORBIDDEN` for a Viewer; `NOT_FOUND` outside the Group.
   */
  create(eventId: number, input: EventItemInput): Promise<EventItem>
  /**
   * `PATCH /events/:id/items/:itemId`. Errors as `create`; an item of another Event is
   * `NOT_FOUND`; a Cancelled item, frozen, `EVENT_ITEM_CANCELLED`.
   */
  update(eventId: number, itemId: number, changes: EventItemChanges): Promise<EventItem>
  /** `DELETE /events/:id/items/:itemId`, in Draft or published. Errors as `update`. */
  remove(eventId: number, itemId: number): Promise<void>
  /**
   * `POST …/items/:itemId/publish` (PROJ-194): an item in Draft starts to reach whom it reaches.
   * Any other is `EVENT_ITEM_NOT_DRAFT`; otherwise errors as `update`.
   */
  publish(eventId: number, itemId: number): Promise<EventItem>
  /**
   * `POST …/items/:itemId/cancel` (PROJ-195): a published item stays in the schedule as
   * `CANCELLED`, frozen. A Draft is `EVENT_ITEM_NOT_PUBLISHED` (it is deleted instead); otherwise
   * errors as `update`.
   */
  cancel(eventId: number, itemId: number): Promise<EventItem>
  /**
   * `POST …/items/:itemId/uncancel` (PROJ-195): back to published. One not Cancelled is
   * `EVENT_ITEM_NOT_CANCELLED`; otherwise errors as `update`.
   */
  uncancel(eventId: number, itemId: number): Promise<EventItem>
  /**
   * `POST /events/:id/items/:itemId/fields` (PROJ-198): adds a Field at the end of the item's.
   * `VALIDATION_ERROR` names a blank or long name, a long value or another type; `FORBIDDEN` for
   * a Viewer; `NOT_FOUND` for an item of another Event.
   */
  addField(eventId: number, itemId: number, input: ItemFieldInput): Promise<ItemField>
  /**
   * `PATCH …/fields/:fieldId`: name, value or Highlight (PROJ-200). Errors as `addField`; a Field
   * of another item is `NOT_FOUND`.
   */
  updateField(
    eventId: number,
    itemId: number,
    fieldId: number,
    changes: ItemFieldChanges,
  ): Promise<ItemField>
  /** `DELETE …/fields/:fieldId`. Errors as `updateField`. */
  removeField(eventId: number, itemId: number, fieldId: number): Promise<void>
  /**
   * `PUT …/fields/order`: the item's Fields in the order given, every one of them once, or else
   * `VALIDATION_ERROR`.
   */
  orderFields(eventId: number, itemId: number, fieldIds: number[]): Promise<void>
}

/** Mirrors the events-api's `GET /events/:id/schedule`. */
export interface ScheduleRepository {
  /**
   * The whole schedule, for an Owner or the Super admin (PROJ-187). A Viewer gets `FORBIDDEN` for
   * now; someone outside the Group `NOT_FOUND`.
   */
  get(eventId: number): Promise<Schedule>
}
