import type { Contribution } from './schemas'

/**
 * Mirrors the events-api Contributions endpoints: `GET /events/:id/contributions` and
 * `GET /events/:id/contributions/:cid/receipt`.
 */
export interface ContributionsRepository {
  /**
   * An Event's Contributions marked paid (`PAID`, `VERIFIED`, `REJECTED`); `FORBIDDEN` for a
   * non-member (even if it doesn't exist).
   */
  list(eventId: number): Promise<Contribution[]>
  /**
   * A short-lived URL to a Contribution's Receipt (events-api ADR-0005), so never cached.
   * `NOT_FOUND` without a Receipt, or for a Contribution `list` doesn't have.
   */
  getReceiptUrl(eventId: number, contributionId: number): Promise<string>
}
