import type { LocalDate, LocalTime, Period } from '@/shared/domain/local-dates'

import type { Event, EventItem, Schedule } from './schemas'

/** Where and when of an Event, as the Owner writes it (events-api PROJ-182). */
export type EventInput = { name: string; place: string; period: Period }

/** An edit: what is left out stays; the period goes whole. */
export type EventChanges = Partial<EventInput>

/** Mirrors the events-api's `events` module. */
export interface EventsRepository {
  /** The Group's Events by start date. `NOT_FOUND` for someone outside the Group. */
  listByGroup(groupId: number): Promise<Event[]>
  /**
   * `POST /groups/:id/events`: an Owner (or the Super admin) creates the Event, born in Draft.
   * `EVENT_PERIOD_INVALID` for an end before the start; `VALIDATION_ERROR` names any other field
   * in its details; `FORBIDDEN` for a Viewer; `NOT_FOUND` outside the Group.
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

/** Mirrors the events-api's Event item writes (`/events/:id/items`). */
export interface EventItemsRepository {
  /**
   * `POST /events/:id/items`: an Owner (or the Super admin) creates the item, born published in a
   * Draft Event. `EVENT_ITEM_TIME_WITHOUT_DATE` for a time with no date; `VALIDATION_ERROR` for a
   * blank name or an empty place; `FORBIDDEN` for a Viewer; `NOT_FOUND` outside the Group.
   */
  create(eventId: number, input: EventItemInput): Promise<EventItem>
  /** `PATCH /events/:id/items/:itemId`. Errors as `create`; an item of another Event is `NOT_FOUND`. */
  update(eventId: number, itemId: number, changes: EventItemChanges): Promise<EventItem>
  /** `DELETE /events/:id/items/:itemId`. `FORBIDDEN` for a Viewer, `NOT_FOUND` as `update`. */
  remove(eventId: number, itemId: number): Promise<void>
}

/** Mirrors the events-api's `GET /events/:id/schedule`. */
export interface ScheduleRepository {
  /**
   * The whole schedule, for an Owner or the Super admin (PROJ-187). A Viewer gets `FORBIDDEN` for
   * now; someone outside the Group `NOT_FOUND`.
   */
  get(eventId: number): Promise<Schedule>
}
