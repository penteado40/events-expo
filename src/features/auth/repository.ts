import type { User } from '@/shared/session'

/** Mirrors the events-api's `GET /me`; signing in itself is Clerk's. */
export interface AuthRepository {
  /**
   * The local User behind Clerk's signed-in identity. `USER_NOT_INVITED` when no User has its
   * email, `USER_DEACTIVATED` for a Deactivated user, `UNAUTHENTICATED` when signed out of Clerk.
   */
  me(): Promise<User>
}
