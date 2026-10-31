import type { Event } from './schemas'

/** Mirrors the events-api's `events` module; this slice only reads. */
export interface EventsRepository {
  /** The Group's Events by start date. `NOT_FOUND` for someone outside the Group. */
  listByGroup(groupId: number): Promise<Event[]>
}
