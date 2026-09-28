import type { User } from '@/shared/session/user'

import type { LoginResponse } from './schemas'

/** Mirrors the events-api auth endpoints: `POST /auth/login` and `GET /me`. */
export interface AuthRepository {
  login(email: string, password: string): Promise<LoginResponse>
  /** The User behind the current token; `UNAUTHENTICATED` when there is none or it was revoked. */
  me(): Promise<User>
}
