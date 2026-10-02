import { z } from 'zod'

import {
  canVerify,
  verificationOutcomes,
  type ContributionStatus,
  type VerificationOutcome,
} from '@/shared/domain/contributions'
import { canSeeGuests } from '@/shared/domain/events'
import { isSuperAdmin, isViewer, type Membership } from '@/shared/domain/roles'
import { ApiError, internalError, validationError } from '@/shared/lib/api-error'
import type { User } from '@/shared/session'

import { createDataset, FAILING_VERIFICATIONS, type EventRow } from './data'

const TOKEN_PREFIX = 'mock-token-'

/** The token the mock hands out for a User, and accepts back. */
export const mockTokenFor = (user: Pick<User, 'id'>) => `${TOKEN_PREFIX}${user.id}`

// The events-api's messages for these codes (its error catalog).
const unauthenticated = () => new ApiError('UNAUTHENTICATED', 'Autenticação necessária.')
const forbidden = () => new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')
export const notFound = () => new ApiError('NOT_FOUND', 'Recurso não encontrado.')
const eventArchived = () =>
  new ApiError('EVENT_ARCHIVED', 'Este evento está arquivado e não aceita alterações.')
const contributionNotPaid = () =>
  new ApiError('CONTRIBUTION_NOT_PAID', 'Esta contribuição ainda não foi marcada como paga.')

const LISTED_CONTRIBUTIONS: ContributionStatus[] = ['PAID', 'VERIFIED', 'REJECTED']
const COUNTED_CONTRIBUTIONS: ContributionStatus[] = ['PAID', 'VERIFIED']

const listedContributions = (event: EventRow) =>
  event.contributions.filter((c) => LISTED_CONTRIBUTIONS.includes(c.status))

const loginBody = z.object({ email: z.email(), password: z.string().min(1) })

type Options = { latencyMs?: number }

export type MockBackend = ReturnType<typeof createMockBackend>

/**
 * A fake events-api in memory (ADR-0002): the sample data and the API's rules (visibility,
 * FORBIDDEN, counts), answering with the API's JSON shapes. Features reach it only through their
 * `mock.ts`, which validates each answer with the feature's schemas.
 *
 * Auth takes the token, as the API does. Every other call takes the requester, the Session's
 * User: a Live session's token means nothing here, yet its modules not live yet still use the
 * mock. A User unknown to the sample data is simply a member of no Event.
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

  function requireRequester(requester: User | null): User {
    if (!requester) throw unauthenticated()
    return requester
  }

  const membershipOf = (event: EventRow, user: User): Membership | null => {
    const member = event.members.find((m) => m.userId === user.id)
    return member ? { role: member.role, isPrimaryOwner: member.isPrimaryOwner } : null
  }

  /**
   * The Event behind `/events/:id/...`, as the API's AccessPolicy finds it: a non-member gets
   * FORBIDDEN whether or not the Event exists, so ids don't leak; only the Super admin gets
   * NOT_FOUND.
   */
  function visibleEvent(requester: User | null, id: number) {
    const user = requireRequester(requester)
    if (!Number.isInteger(id)) throw validationError()
    const event = data.events.find((e) => e.id === id)
    if (isSuperAdmin(user)) {
      if (!event) throw notFound()
      return { event, membership: null }
    }
    const membership = event ? membershipOf(event, user) : null
    if (!event || !membership) throw forbidden()
    return { event, membership }
  }

  /** Like `visibleEvent`, for Guest data: an archived Event keeps it from Managers and Viewers. */
  function eventWithGuests(requester: User | null, id: number) {
    const visible = visibleEvent(requester, id)
    if (!canSeeGuests({ status: visible.event.status, membership: visible.membership })) {
      throw forbidden()
    }
    return visible
  }

  // `GET /events` item: the Event, the requester's Membership, the pending Verification count and
  // the Event summary (events-api PROJ-100).
  function eventJson(event: EventRow, membership: Membership | null) {
    const { members: _members, rsvps, registryItems, contributions, ...fields } = event
    return {
      ...fields,
      membership,
      paidContributionCount: contributions.filter((c) => c.status === 'PAID').length,
      summary: {
        rsvpCount: rsvps.length,
        verifiedAmount: contributions
          .filter((c) => c.status === 'VERIFIED')
          .reduce((sum, c) => sum + c.amount, 0),
        registryItemCount: registryItems.length,
      },
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
    async listEvents(requester: User | null) {
      await delay()
      const user = requireRequester(requester)
      if (isSuperAdmin(user)) return data.events.map((e) => eventJson(e, null))
      return data.events
        .map((event) => ({ event, membership: membershipOf(event, user) }))
        .filter(({ membership }) => membership !== null)
        .map(({ event, membership }) => eventJson(event, membership))
    },

    /** `GET /events/:id`. */
    async getEvent(requester: User | null, id: number) {
      await delay()
      const { event, membership } = visibleEvent(requester, id)
      return eventJson(event, membership)
    },

    /** `GET /events/:id/members`: each Event member with the User's name. */
    async listMembers(requester: User | null, eventId: number) {
      await delay()
      const { event } = visibleEvent(requester, eventId)
      return event.members.map(({ userId, role, isPrimaryOwner }) => ({
        userId,
        name: findUser(userId)?.name ?? '',
        role,
        isPrimaryOwner,
      }))
    },

    /** `GET /events/:id/rsvps`: Guest data, so FORBIDDEN to an archived Event's non-Owners. */
    async listRsvps(requester: User | null, eventId: number) {
      await delay()
      return eventWithGuests(requester, eventId).event.rsvps
    },

    /**
     * `GET /events/:id/registry-items`: no Guest data, so visible on archived Events too. Each item
     * counts its Contributions a Guest marked paid and nobody rejected (`PAID` + `VERIFIED`).
     */
    async listRegistryItems(requester: User | null, eventId: number) {
      await delay()
      const { event } = visibleEvent(requester, eventId)
      return event.registryItems.map((item) => ({
        ...item,
        contributionCount: event.contributions.filter(
          (c) => c.registryItemId === item.id && COUNTED_CONTRIBUTIONS.includes(c.status),
        ).length,
      }))
    },

    /**
     * `GET /events/:id/contributions`: only the ones a Guest marked paid, and their outcome. Guest
     * data, so FORBIDDEN to an archived Event's non-Owners.
     */
    async listContributions(requester: User | null, eventId: number) {
      await delay()
      return listedContributions(eventWithGuests(requester, eventId).event)
    },

    /**
     * `GET /events/:id/contributions/:cid/receipt`: a short-lived URL to the Receipt. NOT_FOUND
     * without a Receipt, or for a Contribution the members' list doesn't have.
     */
    async getReceiptUrl(requester: User | null, eventId: number, contributionId: number) {
      await delay()
      const { event } = eventWithGuests(requester, eventId)
      const contribution = listedContributions(event).find((c) => c.id === contributionId)
      if (!contribution?.hasReceipt) throw notFound()
      return { url: `https://picsum.photos/seed/receipt-${contribution.id}/600/900` }
    },

    /**
     * `PATCH /events/:id/contributions/:cid/verify|reject`: the Verification, or its revision.
     * The role before the state (events-api ADR-0011): a Viewer gets FORBIDDEN, an archived
     * Event's Manager EVENT_ARCHIVED. Asking for the status it already has changes nothing.
     */
    async recordVerification(
      requester: User | null,
      eventId: number,
      contributionId: number,
      outcome: VerificationOutcome,
    ) {
      await delay()
      const { event, membership } = visibleEvent(requester, eventId)
      if (isViewer(membership)) throw forbidden()
      if (!canVerify({ status: event.status, membership })) throw eventArchived()
      const contribution = event.contributions.find((c) => c.id === contributionId)
      if (!contribution) throw notFound()
      // Nothing to verify until a Guest marks it paid; the status it already has changes nothing.
      if (verificationOutcomes(contribution.status).length === 0) throw contributionNotPaid()
      // The sample's way to show a failed Verification and its rollback (Demo mode).
      if (FAILING_VERIFICATIONS.includes(contribution.id)) throw internalError()
      contribution.status = outcome
      return contribution
    },

    /** A sample User by id (e.g. the ones "Modo demo" enters as). */
    user(id: number): User {
      const user = findUser(id)
      if (!user) throw new Error(`No sample User with id ${id}`)
      return user
    },
  }
}
