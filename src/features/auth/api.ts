import { useSession, type Session } from '@/shared/session'

import { createMockAuthRepository, DEMO_USER, mockTokenFor } from './mock'
import type { AuthRepository } from './repository'

export type { AuthRepository } from './repository'

const MOCK_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 300

/**
 * The feature's only door to its data. While `auth` is not in LIVE_MODULES this is the mock;
 * PROJ-86 adds the HTTP implementation and picks it for Live sessions.
 */
export const authRepository: AuthRepository = createMockAuthRepository({
  getToken: () => useSession.getState().session?.token ?? null,
  latencyMs: MOCK_LATENCY_MS,
})

/** The Session that "Modo demo" opens: the demo Super admin, no API behind it. */
export const createDemoSession = (): Session => ({
  token: mockTokenFor(DEMO_USER),
  user: DEMO_USER,
  live: false,
})
