import type { Contribution } from './schemas'

/**
 * Mirrors the events-api Contributions endpoints: `GET /events/:id/contributions`,
 * `PATCH /events/:id/contributions/:cid/verify|reject` and `GET .../:cid/receipt`.
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
  /**
   * The Verification: the Pix arrived (`VERIFIED`). From `PAID`, or revising a `REJECTED` one
   * (events-api ADR-0004's refinement); already `VERIFIED` changes nothing. `PENDING` or
   * `ABANDONED` → `CONTRIBUTION_NOT_PAID`; a Viewer → `FORBIDDEN`; an archived Event's Manager →
   * `EVENT_ARCHIVED`.
   */
  verify(eventId: number, contributionId: number): Promise<Contribution>
  /** The Verification: the Pix didn't arrive (`REJECTED`). From `PAID` or `VERIFIED`; as `verify`. */
  reject(eventId: number, contributionId: number): Promise<Contribution>
}
