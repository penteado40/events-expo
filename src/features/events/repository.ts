import type { Event } from './schemas'

/** Mirrors the events-api Events endpoints: `GET /events` and `GET /events/:id`. */
export interface EventsRepository {
  /** Every Event for the Super admin; only the requester's own for anyone else. */
  list(): Promise<Event[]>
  /** One Event; `FORBIDDEN` for a non-member (even if it doesn't exist), `NOT_FOUND` otherwise. */
  get(id: number): Promise<Event>
}
