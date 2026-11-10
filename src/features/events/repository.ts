import type { Period } from '@/shared/domain/local-dates'

import type { Event } from './schemas'

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
   * `VALIDATION_ERROR` names the field in its details (`period.endDate` for an end before the
   * start); `FORBIDDEN` for a Viewer; `NOT_FOUND` outside the Group.
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
