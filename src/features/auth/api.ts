import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { identity, userSchema, type Session } from '@/shared/session'

import { createMockAuthRepository, createMockSession, type DemoAccount } from './mock'
import type { AuthRepository } from './repository'

export type { AuthRepository } from './repository'
export type { DemoAccount } from './mock'

/** `GET /me` with Clerk's token. */
export function createHttpAuthRepository(http: HttpClient): AuthRepository {
  return { me: () => http.get('/me', { schema: userSchema }) }
}

/**
 * The feature's only door to its data. Until `auth` is live, a development build answers a real
 * Clerk sign-in from the sample Users, by the email Clerk verified.
 */
export const authRepository = selectRepository<AuthRepository>('auth', {
  http: createHttpAuthRepository(apiClient),
  mock: createMockAuthRepository({ getEmail: () => identity.email() }),
})

/**
 * The Session that "Modo demo" opens for that account: sample data, no Clerk or API behind it.
 * Built by the mock, which only this file may import, so hooks and screens reach it here.
 */
export const createDemoSession = (account: DemoAccount): Session => createMockSession(account)
