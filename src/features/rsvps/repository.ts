import type { Rsvp } from './schemas'

/** Mirrors the events-api RSVP endpoint: `GET /events/:id/rsvps`. */
export interface RsvpsRepository {
  /** An Event's RSVPs; `FORBIDDEN` for a non-member (even if it doesn't exist). */
  list(eventId: number): Promise<Rsvp[]>
}
