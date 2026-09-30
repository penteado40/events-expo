import type { EventMember } from './schemas'

/** Mirrors the events-api Members endpoint: `GET /events/:id/members`. */
export interface MembersRepository {
  /** An Event's members; `FORBIDDEN` for a non-member (even if it doesn't exist). */
  list(eventId: number): Promise<EventMember[]>
}
