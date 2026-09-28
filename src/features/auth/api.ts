import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { LIVE_MODULES } from '@/shared/lib/live-modules'
import { useSession, userSchema, type Session } from '@/shared/session'

import { createMockAuthRepository, DEMO_USER, mockTokenFor } from './mock'
import type { AuthRepository } from './repository'
import { loginResponseSchema } from './schemas'

export type { AuthRepository } from './repository'

const MOCK_LATENCY_MS = process.env.NODE_ENV === 'test' ? 0 : 300

/** `POST /auth/login`, then `GET /me` with the new token, as the design's login flow does. */
export function createHttpAuthRepository(http: HttpClient): AuthRepository {
  const me = (token?: string) => http.get('/me', { schema: userSchema, token })
  return {
    async login(input) {
      const { token } = await http.post('/auth/login', { body: input, schema: loginResponseSchema })
      return { token, user: await me(token) }
    },
    me: () => me(),
  }
}

type Options = {
  /** Development build (`__DEV__`). */
  isDev?: boolean
  http?: HttpClient
}

/**
 * Picks the feature's implementation per call: the mock in Demo mode, or while `auth` is not in
 * LIVE_MODULES; HTTP otherwise. With `auth` live, "Entrar" (no Session yet) always goes to the API.
 * The mock is only ever used in a development build.
 */
export function createAuthRepository({
  isDev = __DEV__,
  http = apiClient,
}: Options = {}): AuthRepository {
  const httpRepository = createHttpAuthRepository(http)
  const mockRepository = createMockAuthRepository({
    getToken: () => useSession.getState().session?.token ?? null,
    latencyMs: MOCK_LATENCY_MS,
  })
  const forSession = () => {
    const demoMode = useSession.getState().session?.live === false
    const useMock = isDev && (demoMode || !LIVE_MODULES.includes('auth'))
    return useMock ? mockRepository : httpRepository
  }

  return {
    login: (input) => forSession().login(input),
    me: () => forSession().me(),
  }
}

/** The feature's only door to its data. */
export const authRepository = createAuthRepository()

/** The Session that "Modo demo" opens: the demo Super admin, no API behind it. */
export const createDemoSession = (): Session => ({
  token: mockTokenFor(DEMO_USER),
  user: DEMO_USER,
  live: false,
})
