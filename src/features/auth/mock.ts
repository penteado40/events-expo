import {
  DEMO_OWNER_ID,
  DEMO_VIEWER_ID,
  mockBackend,
  SUPER_ADMIN_ID,
  type MockBackend,
} from '@/shared/mock-backend'
import { userSchema, type Session } from '@/shared/session'

import type { AuthRepository } from './repository'

type Options = {
  /** The email Clerk verified for the signed-in user, as the API's AuthVerifier reads it. */
  getEmail: () => Promise<string | null>
  backend?: MockBackend
}

/** AuthRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockAuthRepository({
  getEmail,
  backend = mockBackend,
}: Options): AuthRepository {
  return {
    async me() {
      const email = await getEmail()
      return userSchema.parse(await backend.me(email === null ? null : { email }))
    },
  }
}

/** Who "Modo demo" can enter as: the sample Owner, Viewer or Super admin. */
export type DemoAccount = 'OWNER' | 'VIEWER' | 'SUPER_ADMIN'

const DEMO_USER_IDS: Record<DemoAccount, number> = {
  OWNER: DEMO_OWNER_ID,
  VIEWER: DEMO_VIEWER_ID,
  SUPER_ADMIN: SUPER_ADMIN_ID,
}

/** A Demo mode Session as one of the sample Users: no Clerk and no API behind it. */
export function createMockSession(account: DemoAccount): Session {
  const user = userSchema.parse(mockBackend.user(DEMO_USER_IDS[account]))
  return { id: `demo-${user.id}`, user, live: false }
}
