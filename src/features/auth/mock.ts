import {
  DEMO_USER_ID,
  mockBackend,
  mockTokenFor,
  SUPER_ADMIN_ID,
  type MockBackend,
} from '@/shared/mock-backend'
import { userSchema, type Session } from '@/shared/session'

import type { AuthRepository } from './repository'
import { loginResponseSchema } from './schemas'

type Options = {
  getToken: () => string | null
  backend?: MockBackend
}

/** AuthRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockAuthRepository({
  getToken,
  backend = mockBackend,
}: Options): AuthRepository {
  return {
    login: async (input) => loginResponseSchema.parse(await backend.login(input)),
    me: async () => userSchema.parse(await backend.me(getToken())),
  }
}

/** Who "Modo demo" can enter as: the demo Super admin or the demo User. */
export type DemoAccount = 'SUPER_ADMIN' | 'USER'

const DEMO_USER_IDS: Record<DemoAccount, number> = {
  SUPER_ADMIN: SUPER_ADMIN_ID,
  USER: DEMO_USER_ID,
}

/** A Demo mode Session as one of the sample Users, with the token the mock backend accepts. */
export function createMockSession(account: DemoAccount): Session {
  const user = mockBackend.user(DEMO_USER_IDS[account])
  return { token: mockTokenFor(user), user, live: false }
}
