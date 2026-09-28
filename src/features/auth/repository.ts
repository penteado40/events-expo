import type { User } from '@/shared/session'

import type { LoginInput, LoginResponse } from './schemas'

/** Mirrors the events-api auth endpoints: `POST /auth/login` and `GET /me`. */
export interface AuthRepository {
  login(input: LoginInput): Promise<LoginResponse>
  /** The User behind the current token; `UNAUTHENTICATED` when there is none or it was revoked. */
  me(): Promise<User>
}
