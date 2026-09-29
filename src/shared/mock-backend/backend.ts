import { z } from 'zod'

import { ApiError, validationError } from '@/shared/lib/api-error'
import type { Membership } from '@/shared/domain/roles'
import type { User } from '@/shared/session'

import { createDataset, type EventRow } from './data'

const TOKEN_PREFIX = 'mock-token-'

/** The token the mock hands out for a User, and accepts back. */
export const mockTokenFor = (user: Pick<User, 'id'>) => `${TOKEN_PREFIX}${user.id}`

// The events-api's messages for these codes (its error catalog).
const unauthenticated = () => new ApiError('UNAUTHENTICATED', 'Autenticação necessária.')
const forbidden = () => new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')
const notFound = () => new ApiError('NOT_FOUND', 'Recurso não encontrado.')

const loginBody = z.object({ email: z.email(), password: z.string().min(1) })

type Options = { latencyMs?: number }

export type MockBackend = ReturnType<typeof createMockBackend>

/**
 * A fake events-api in memory (ADR-0002): the sample data and the API's rules (visibility,
 * FORBIDDEN, counts), answering with the API's JSON shapes. Features reach it only through their
 * `mock.ts`, which validates each answer with the feature's schemas.
 */
export function createMockBackend({ latencyMs = 0 }: Options = {}) {
  const data = createDataset()
  const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs))

  const findUser = (id: number) => data.accounts.find((a) => a.user.id === id)?.user

  /** The User behind a token, as the API's auth guard resolves it. */
  function authenticate(token: string | null): User {
    const account = data.accounts.find((a) => token !== null && mockTokenFor(a.user) === token)
    if (!account) throw unauthenticated()
    return account.user
  }

  const membershipOf = (event: EventRow, user: User): Membership | null => {
    const member = event.members.find((m) => m.userId === user.id)
    return member ? { role: member.role, isPrimaryOwner: member.isPrimaryOwner } : null
  }

  // `GET /events` item: the Event, the requester's Membership and the pending Verification count.
  function eventJson(event: EventRow, membership: Membership | null) {
    const { members: _members, contributions, ...fields } = event
    return {
      ...fields,
      membership,
      paidContributionCount: contributions.filter((c) => c.status === 'PAID').length,
    }
  }

  return {
    /** `POST /auth/login`. */
    async login(body: unknown) {
      await delay()
      const parsed = loginBody.safeParse(body)
      if (!parsed.success) throw validationError(parsed.error.issues)
      const { email, password } = parsed.data
      const account = data.accounts.find(
        (a) => a.password !== undefined && a.user.email === email && a.password === password,
      )
      if (!account) throw new ApiError('INVALID_CREDENTIALS', 'Email ou senha inválidos.')
      return { token: mockTokenFor(account.user), user: account.user }
    },

    /** `GET /me`. */
    async me(token: string | null) {
      await delay()
      return authenticate(token)
    },

    /** `GET /events`: every Event for the Super admin, only their own for anyone else. */
    async listEvents(token: string | null) {
      await delay()
      const user = authenticate(token)
      if (user.role === 'SUPER_ADMIN') return data.events.map((e) => eventJson(e, null))
      return data.events
        .map((event) => ({ event, membership: membershipOf(event, user) }))
        .filter(({ membership }) => membership !== null)
        .map(({ event, membership }) => eventJson(event, membership))
    },

    /**
     * `GET /events/:id`. A non-member gets FORBIDDEN whether or not the Event exists, so ids
     * don't leak; only the Super admin gets NOT_FOUND.
     */
    async getEvent(token: string | null, id: number) {
      await delay()
      const user = authenticate(token)
      if (!Number.isInteger(id)) throw validationError()
      const event = data.events.find((e) => e.id === id)
      if (user.role === 'SUPER_ADMIN') {
        if (!event) throw notFound()
        return eventJson(event, null)
      }
      const membership = event ? membershipOf(event, user) : null
      if (!event || !membership) throw forbidden()
      return eventJson(event, membership)
    },

    /** A sample User by id (e.g. the ones "Modo demo" enters as). */
    user(id: number): User {
      const user = findUser(id)
      if (!user) throw new Error(`No sample User with id ${id}`)
      return user
    },
  }
}
