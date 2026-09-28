import { ApiError } from '@/shared/lib/api-error'
import { useSession, type Session } from '@/shared/session'

import { createMockAuthRepository, DEMO_USER, mockTokenFor } from './mock'
import type { AuthRepository } from './repository'

export type { AuthRepository } from './repository'

const MOCK_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 300

/** What a release build gets until PROJ-86 adds HTTP: the mock is only ever used in development. */
const unavailable = async (): Promise<never> => {
  throw new ApiError('INTERNAL_ERROR', 'Login indisponível nesta versão do app.')
}

type Options = {
  /** Development build (`__DEV__`). */
  isDev?: boolean
}

/**
 * Picks the feature's implementation. While `auth` is not in LIVE_MODULES that is the mock, and
 * only in a development build; PROJ-86 adds the HTTP implementation and picks it for Live sessions.
 */
export function createAuthRepository({ isDev = __DEV__ }: Options = {}): AuthRepository {
  if (!isDev) return { login: unavailable, me: unavailable }
  return createMockAuthRepository({
    getToken: () => useSession.getState().session?.token ?? null,
    latencyMs: MOCK_LATENCY_MS,
  })
}

/** The feature's only door to its data. */
export const authRepository = createAuthRepository()

/** The Session that "Modo demo" opens: the demo Super admin, no API behind it. */
export const createDemoSession = (): Session => ({
  token: mockTokenFor(DEMO_USER),
  user: DEMO_USER,
  live: false,
})
