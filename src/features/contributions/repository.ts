import type { Contribution } from './schemas'

/** Mirrors the events-api Contributions endpoints: `GET /events/:id/contributions`. */
export interface ContributionsRepository {
  /**
   * An Event's Contributions marked paid (`PAID`, `VERIFIED`, `REJECTED`); `FORBIDDEN` for a
   * non-member (even if it doesn't exist).
   */
  list(eventId: number): Promise<Contribution[]>
}
