import { ApiError } from '@/shared/lib/api-error'

import { createDataset, type UserRow } from './data'

/** What the API's AuthVerifier reads from a valid Clerk token (events-api ADR-0020). */
export type VerifiedIdentity = { email: string }

// The events-api's messages for these codes (its error catalog).
const unauthenticated = () => new ApiError('UNAUTHENTICATED', 'Autenticação necessária.')
const userNotInvited = () =>
  new ApiError(
    'USER_NOT_INVITED',
    'Nenhum usuário da plataforma tem este email. Entre com o email que recebeu o link de ativação.',
  )
const userDeactivated = () =>
  new ApiError('USER_DEACTIVATED', 'Seu acesso à plataforma foi retirado.')
export const notFound = () => new ApiError('NOT_FOUND', 'Recurso não encontrado.')

type Options = { latencyMs?: number }

export type MockBackend = ReturnType<typeof createMockBackend>

/**
 * A fake events-api in memory (ADR-0002): the sample data and the API's rules, answering with the
 * API's JSON shapes. Features reach it only through their `mock.ts`, which validates each answer
 * with the feature's schemas.
 *
 * Auth takes the verified identity, as the API's guard gets it from Clerk: the User is found by
 * the email, with no open sign-up. Every other call will take the requester, the Session's User.
 */
export function createMockBackend({ latencyMs = 0 }: Options = {}) {
  const data = createDataset()
  const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs))

  /** `GET /me`: the User, its Membership, and whether it is the Super admin (PROJ-178). */
  function userJson({ deactivatedAt: _deactivatedAt, ...user }: UserRow) {
    const memberships = data.groupMembers
      .filter((m) => m.userId === user.id)
      .map(({ groupId, role }) => ({
        groupId,
        groupName: data.groups.find((g) => g.id === groupId)!.name,
        role,
      }))
    return { ...user, memberships }
  }

  /** The User behind an identity, as the API's guard resolves it. */
  function authenticate(identity: VerifiedIdentity | null): UserRow {
    if (!identity) throw unauthenticated()
    const email = identity.email.toLowerCase()
    const found = data.users.find((u) => u.email === email)
    if (!found) throw userNotInvited()
    if (found.deactivatedAt) throw userDeactivated()
    return found
  }

  return {
    async me(identity: VerifiedIdentity | null) {
      await delay()
      return userJson(authenticate(identity))
    },

    /** A sample User as `GET /me` would return it, for Demo mode. */
    user(id: number) {
      const found = data.users.find((u) => u.id === id)
      if (!found) throw notFound()
      return userJson(found)
    },
  }
}
