import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { useSession, userSchema, type Session } from '@/shared/session'

import { createMockAuthRepository, createMockSession, type DemoAccount } from './mock'
import type { AuthRepository } from './repository'
import { loginResponseSchema } from './schemas'

export type { AuthRepository } from './repository'
export type { DemoAccount } from './mock'

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

/** The feature's only door to its data. With `auth` live, "Entrar" always goes to the API. */
export const authRepository = selectRepository<AuthRepository>('auth', {
  http: createHttpAuthRepository(apiClient),
  mock: createMockAuthRepository({
    getToken: () => useSession.getState().session?.token ?? null,
  }),
})

/** The Session that "Modo demo" opens for that account: sample data, no API behind it. */
export const createDemoSession = (account: DemoAccount): Session => createMockSession(account)
