import type { User } from '@/shared/session'

/** What the person can change of their own account: the email is Clerk's and never edited here. */
export type ProfileChanges = { name?: string; phone?: string }

/** Mirrors the events-api's `PATCH /me` (PROJ-165). */
export interface ProfileRepository {
  /**
   * Edits the signed-in User's name and phone (any usual typing with the country code; stored in
   * E.164); what is left out stays. Answers the User as `GET /me` does. `VALIDATION_ERROR` for an
   * invalid name (its `details` name the `name` path) or phone (no details).
   */
  updateMe(changes: ProfileChanges): Promise<User>
}
