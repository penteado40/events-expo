import { ApiError } from '@/shared/lib/api-error'
import type { User } from '@/shared/session/user'

import type { AuthRepository } from './repository'
import { loginInputSchema, loginResponseSchema } from './schemas'

type MockAccount = { user: User; password: string }

/** Demo users. Add rows here to explore other roles. */
const ACCOUNTS: MockAccount[] = [
  {
    user: {
      id: 1,
      name: 'Admin Local',
      email: 'admin@local.test',
      role: 'SUPER_ADMIN',
      createdAt: '2026-01-01T12:00:00.000Z',
    },
    password: 'admin123',
  },
]

/** The User that "Modo demo" enters as. */
export const DEMO_USER: User = ACCOUNTS[0].user

const TOKEN_PREFIX = 'mock-token-'

export const mockTokenFor = (user: User) => `${TOKEN_PREFIX}${user.id}`

type Options = {
  getToken: () => string | null
  latencyMs?: number
}

export function createMockAuthRepository({ getToken, latencyMs = 0 }: Options): AuthRepository {
  const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs))

  return {
    async login(email, password) {
      await delay()
      const input = loginInputSchema.safeParse({ email, password })
      if (!input.success) {
        throw new ApiError('VALIDATION_ERROR', 'Dados inválidos.', input.error.issues)
      }
      const account = ACCOUNTS.find((a) => a.user.email === email && a.password === password)
      if (!account) throw new ApiError('INVALID_CREDENTIALS', 'Email ou senha inválidos.')
      return loginResponseSchema.parse({ token: mockTokenFor(account.user), user: account.user })
    },

    async me() {
      await delay()
      const token = getToken()
      const account = ACCOUNTS.find((a) => token !== null && mockTokenFor(a.user) === token)
      if (!account) throw new ApiError('UNAUTHENTICATED', 'Sessão inválida.')
      return account.user
    },
  }
}
