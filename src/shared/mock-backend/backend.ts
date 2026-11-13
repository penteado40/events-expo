import { isEmail } from '@/shared/domain/email'
import { isLocalDate, type Period } from '@/shared/domain/local-dates'
import { isTimezone } from '@/shared/domain/timezones'
import { normalizePhone } from '@/shared/domain/phone'
import { ApiError, validationError } from '@/shared/lib/api-error'

import { createDataset, type EventRow, type UserRow } from './data'

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
const forbidden = () => new ApiError('FORBIDDEN', 'Você não tem permissão para esta ação.')
const alreadyAGroupMember = () =>
  new ApiError('ALREADY_A_GROUP_MEMBER', 'Esta pessoa já é Group member deste Group.')
const superAdminNotAGroupMember = () =>
  new ApiError('SUPER_ADMIN_NOT_A_GROUP_MEMBER', 'O Super admin não pode ser Group member.')
const userAlreadyActive = () => new ApiError('USER_ALREADY_ACTIVE', 'Este usuário já está ativo.')

/** How long an Activation link lasts (the Clerk invitation the events-api creates). */
const LINK_DAYS = 7

/** The body of `POST /groups/:id/viewers`: name and phone are used only for a new email. */
export type NewViewerBody = { name: string; email: string; phone: string }

/** The body of `PATCH /me`: what is left out stays. The email is Clerk's and never edited here. */
export type MeChanges = { name?: string; phone?: string }

/** The body of `POST /groups/:id/events`, and of `PATCH /events/:id` with every field optional. */
export type EventBody = {
  name?: string
  place?: string
  period?: Period
}

type Detail = { path: string; message: string }

const EVENT_NAME_MAX = 100
const EVENT_PLACE_MAX = 200

/**
 * Checks an Event's body as the API's DTO would (PROJ-182): name and place trimmed and required,
 * the period's real dates, a known IANA timezone and an end not before the start. Answers the
 * trimmed values, or throws `VALIDATION_ERROR` with a detail per field.
 */
function checkEventBody(body: EventBody, { partial }: { partial: boolean }) {
  const { name, place, period, ...rest } = body
  const details: Detail[] = Object.keys(rest).map((key) => ({
    path: key,
    message: 'Campo desconhecido.',
  }))
  const text = (value: string | undefined, path: string, max: number) => {
    if (value === undefined) {
      if (!partial) details.push({ path, message: 'Obrigatório.' })
      return undefined
    }
    const trimmed = value.trim()
    if (trimmed.length < 1 || trimmed.length > max) {
      details.push({ path, message: `Use de 1 a ${max} caracteres.` })
    }
    return trimmed
  }
  const checked = {
    name: text(name, 'name', EVENT_NAME_MAX),
    place: text(place, 'place', EVENT_PLACE_MAX),
    period,
  }
  if (period === undefined) {
    if (!partial) details.push({ path: 'period', message: 'Obrigatório.' })
  } else {
    const { startDate, endDate, timezone } = period
    if (!isLocalDate(startDate))
      details.push({ path: 'period.startDate', message: 'Data inválida.' })
    if (!isLocalDate(endDate)) details.push({ path: 'period.endDate', message: 'Data inválida.' })
    else if (isLocalDate(startDate) && endDate < startDate) {
      details.push({ path: 'period.endDate', message: 'A data final vem antes da inicial.' })
    }
    if (!isTimezone(timezone)) details.push({ path: 'period.timezone', message: 'Fuso inválido.' })
  }
  if (partial && name === undefined && place === undefined && period === undefined) {
    details.push({ path: '', message: 'Nada para alterar.' })
  }
  if (details.length > 0) throw validationError(details)
  return checked
}

type Options = { latencyMs?: number }

export type MockBackend = ReturnType<typeof createMockBackend>

/**
 * A fake events-api in memory (ADR-0002): the sample data and the API's rules, answering with the
 * API's JSON shapes. Features reach it only through their `mock.ts`, which validates each answer
 * with the feature's schemas.
 *
 * Every call takes the verified identity, as the API's guard gets it from Clerk: the User is found
 * by the email, with no open sign-up. The features' mocks pass the Session's User's email.
 */
export function createMockBackend({ latencyMs = 0 }: Options = {}) {
  const data = createDataset()
  const delay = () => new Promise((resolve) => setTimeout(resolve, latencyMs))

  /** `GET /me`: the User, its Membership, and whether it is the Super admin (PROJ-178). */
  function userJson({ deactivatedAt: _deactivatedAt, isPending: _isPending, ...user }: UserRow) {
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

  /**
   * The requester of every call but `GET /me`. A Live session's User exists in the real API but
   * not in the sample data: for the modules not live yet, the mock takes them as a User of no
   * Group (an empty Início), never `USER_NOT_INVITED`, which only sign-in answers.
   */
  function requester(identity: VerifiedIdentity | null): UserRow {
    if (!identity) throw unauthenticated()
    const email = identity.email.toLowerCase()
    const found = data.users.find((u) => u.email === email)
    if (found?.deactivatedAt) throw userDeactivated()
    return (
      found ?? {
        id: 0,
        name: email,
        email,
        phone: '',
        isSuperAdmin: false,
        deactivatedAt: null,
        isPending: false,
      }
    )
  }

  const isMember = (userId: number, groupId: number) =>
    data.groupMembers.some((m) => m.userId === userId && m.groupId === groupId)
  const roleIn = (userId: number, groupId: number) =>
    data.groupMembers.find((m) => m.userId === userId && m.groupId === groupId)?.role ?? null

  /** Each Activation link handed out, so a new one differs from the last. */
  let linksIssued = 0
  function newActivationLink() {
    linksIssued += 1
    const expiresAt = new Date(Date.now() + LINK_DAYS * 24 * 60 * 60 * 1000)
    return {
      url: `https://clerk.events.test/v1/tickets/accept?ticket=mock-${linksIssued}`,
      expiresAt: expiresAt.toISOString(),
    }
  }

  /** The API's `manageViewers` (and Teams'): the Super admin or an Owner of the Group. */
  function assertManagesGroup(asker: UserRow, groupId: number) {
    assertSeesGroup(asker, groupId)
    if (!asker.isSuperAdmin && roleIn(asker.id, groupId) !== 'OWNER') throw forbidden()
  }

  /** Anyone outside the Group gets `NOT_FOUND`, so it does not leak. */
  function assertSeesGroup(asker: UserRow, groupId: number) {
    const group = data.groups.find((g) => g.id === groupId)
    if (!group || !(asker.isSuperAdmin || isMember(asker.id, groupId))) throw notFound()
  }

  const teamsOf = (groupId: number) =>
    data.teams
      .filter((t) => t.groupId === groupId)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  /**
   * The Group as the asker reaches it: `NOT_FOUND` when it does not exist or they are not in it,
   * `FORBIDDEN` when they are but only a Viewer and `write` is asked.
   */
  function reachGroup(asker: UserRow, groupId: number, { write }: { write: boolean }) {
    const group = data.groups.find((g) => g.id === groupId)
    if (!group || !(asker.isSuperAdmin || isMember(asker.id, groupId))) throw notFound()
    const isOwner = data.groupMembers.some(
      (m) => m.userId === asker.id && m.groupId === groupId && m.role === 'OWNER',
    )
    if (write && !asker.isSuperAdmin && !isOwner) throw forbidden()
    return group
  }

  function reachEvent(asker: UserRow, eventId: number, options: { write: boolean }) {
    const row = data.events.find((e) => e.id === eventId)
    if (!row) throw notFound()
    reachGroup(asker, row.groupId, options)
    return row
  }

  /** An Event as `GET /groups/:id/events` lists it, for the requester. */
  function eventJson(row: EventRow, requester: UserRow) {
    const { participantIds, startDate, endDate, timezone, ...event } = row
    return {
      ...event,
      period: { startDate, endDate, timezone },
      isParticipant: participantIds.includes(requester.id),
    }
  }

  return {
    async me(identity: VerifiedIdentity | null) {
      await delay()
      return userJson(authenticate(identity))
    },

    /**
     * `PATCH /me` (events-api PROJ-165): the User edits their own name and phone, answered as
     * `GET /me`. Validated as the API's DTO (name trimmed, 1–100; at least one field; no other
     * field) and its Phone (E.164 once the separators are dropped), whose refusal has no details.
     */
    async updateMe(identity: VerifiedIdentity | null, changes: MeChanges) {
      await delay()
      const found = authenticate(identity)
      const { name, phone, ...rest } = changes
      if (Object.keys(rest).length > 0 || (name === undefined && phone === undefined)) {
        throw validationError()
      }
      const trimmed = name?.trim()
      if (trimmed !== undefined && (trimmed.length < 1 || trimmed.length > 100)) {
        throw validationError([{ path: 'name', message: 'Informe um nome de 1 a 100 caracteres.' }])
      }
      const e164 = phone === undefined ? undefined : normalizePhone(phone.trim())
      if (e164 === null) throw validationError()
      if (trimmed !== undefined) found.name = trimmed
      if (e164 !== undefined) found.phone = e164
      return userJson(found)
    },

    /**
     * `GET /groups` (events-api PROJ-168): the Groups the User is a Group member of, every Group
     * for the Super admin; by name.
     */
    async groups(identity: VerifiedIdentity | null) {
      await delay()
      const asker = requester(identity)
      return data.groups
        .filter((g) => asker.isSuperAdmin || isMember(asker.id, g.id))
        .map(({ id, name }) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    },

    /**
     * `GET /groups/:id/events` (events-api PROJ-182): every Event of the Group with where, when
     * and state, Drafts included, by start date. Anyone outside the Group gets `NOT_FOUND`.
     */
    async groupEvents(identity: VerifiedIdentity | null, groupId: number) {
      await delay()
      const asker = requester(identity)
      reachGroup(asker, groupId, { write: false })
      return data.events
        .filter((e) => e.groupId === groupId)
        .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id)
        .map((e) => eventJson(e, asker))
    },

    /**
     * `GET /groups/:id/members` (events-api PROJ-178): who is in the Group, in the order they
     * joined.
     */
    async groupMembers(identity: VerifiedIdentity | null, groupId: number) {
      await delay()
      assertSeesGroup(requester(identity), groupId)
      return data.groupMembers
        .filter((m) => m.groupId === groupId)
        .map(({ userId, role }) => {
          const { name, email, phone, isPending } = data.users.find((u) => u.id === userId)!
          return { userId, name, email, phone, role, isPending }
        })
    },

    /**
     * `GET /groups/:id/teams` (events-api PROJ-181): the Group's Teams by name. `members` comes
     * with PROJ-183, whose shape is assumed (`[{ userId }]`, see the groups feature's schemas).
     */
    async groupTeams(identity: VerifiedIdentity | null, groupId: number) {
      await delay()
      assertSeesGroup(requester(identity), groupId)
      return teamsOf(groupId).map(({ id, groupId: group, name, createdAt, memberIds }) => ({
        id,
        groupId: group,
        name,
        createdAt,
        members: memberIds.map((userId) => ({ userId })),
      }))
    },

    /**
     * `POST /groups/:id/viewers` (events-api PROJ-177): adds a person as a Viewer by email. A new
     * email becomes a Pending user with the name and phone, and only then the answer carries the
     * Activation link. Validated as the API's DTO, then its Phone for the new User.
     */
    async addViewer(identity: VerifiedIdentity | null, groupId: number, body: NewViewerBody) {
      await delay()
      const asker = requester(identity)
      const email = body.email?.trim().toLowerCase() ?? ''
      const name = body.name?.trim() ?? ''
      const phone = body.phone?.trim() ?? ''
      const invalid = [
        !isEmail(email) && 'email',
        (name.length < 1 || name.length > 100) && 'name',
        (phone.length < 1 || phone.length > 30) && 'phone',
      ].filter((path): path is string => path !== false)
      if (invalid.length > 0) {
        throw validationError(invalid.map((path) => ({ path, message: 'Dados inválidos.' })))
      }
      assertManagesGroup(asker, groupId)

      let user = data.users.find((u) => u.email === email)
      let activationLink: ReturnType<typeof newActivationLink> | null = null
      if (user?.isSuperAdmin) throw superAdminNotAGroupMember()
      if (user && isMember(user.id, groupId)) throw alreadyAGroupMember()
      // A Pending user who already had a link gets none: only the Group access email.
      if (!user) {
        const e164 = normalizePhone(phone)
        if (e164 === null) throw validationError()
        user = {
          id: Math.max(...data.users.map((u) => u.id)) + 1,
          name,
          email,
          phone: e164,
          isSuperAdmin: false,
          deactivatedAt: null,
          isPending: true,
        }
        data.users.push(user)
        activationLink = newActivationLink()
      }
      data.groupMembers.push({ groupId, userId: user.id, role: 'VIEWER' })
      return {
        member: {
          groupId,
          role: 'VIEWER' as const,
          user: { id: user.id, name: user.name, email: user.email, isPending: user.isPending },
        },
        activationLink,
      }
    },

    /**
     * `POST /groups/:id/members/:userId/activation-link` (events-api PROJ-180): a new Activation
     * link for a pending Group member; the previous one stops working.
     */
    async reissueActivationLink(
      identity: VerifiedIdentity | null,
      groupId: number,
      userId: number,
    ) {
      await delay()
      assertManagesGroup(requester(identity), groupId)
      if (!isMember(userId, groupId)) throw notFound()
      if (!data.users.find((u) => u.id === userId)!.isPending) throw userAlreadyActive()
      return newActivationLink()
    },

    /**
     * `DELETE /groups/:id/viewers/:userId` (events-api PROJ-179): takes a Viewer out of the Group,
     * and out of its Teams (PROJ-183). An Owner is `NOT_FOUND` here.
     */
    async removeViewer(identity: VerifiedIdentity | null, groupId: number, userId: number) {
      await delay()
      assertManagesGroup(requester(identity), groupId)
      if (roleIn(userId, groupId) !== 'VIEWER') throw notFound()
      data.groupMembers = data.groupMembers.filter(
        (m) => !(m.groupId === groupId && m.userId === userId),
      )
      for (const team of data.teams.filter((t) => t.groupId === groupId)) {
        team.memberIds = team.memberIds.filter((id) => id !== userId)
      }
    },

    /**
     * `PUT /groups/:id/teams/:teamId/members/:userId`, as PROJ-183 plans it (not built in the
     * events-api yet): puts a Group member in a Team; already there, nothing changes.
     */
    async addTeamMember(
      identity: VerifiedIdentity | null,
      groupId: number,
      teamId: number,
      userId: number,
    ) {
      await delay()
      assertManagesGroup(requester(identity), groupId)
      const team = data.teams.find((t) => t.id === teamId && t.groupId === groupId)
      if (!team || !isMember(userId, groupId)) throw notFound()
      if (!team.memberIds.includes(userId)) team.memberIds.push(userId)
    },

    /**
     * `POST /groups/:id/events` (events-api PROJ-182): an Owner or the Super admin creates the
     * Event, born in Draft and with no Participants yet.
     */
    async createEvent(identity: VerifiedIdentity | null, groupId: number, body: EventBody) {
      await delay()
      const asker = requester(identity)
      reachGroup(asker, groupId, { write: true })
      const { name, place, period } = checkEventBody(body, { partial: false })
      const row: EventRow = {
        id: Math.max(0, ...data.events.map((e) => e.id)) + 1,
        groupId,
        name: name!,
        place: place!,
        ...period!,
        status: 'DRAFT',
        cancelled: false,
        participantIds: [],
      }
      data.events.push(row)
      return eventJson(row, asker)
    },

    /** `GET /events/:id` (PROJ-182): any Group member, and the Super admin. */
    async event(identity: VerifiedIdentity | null, eventId: number) {
      await delay()
      const asker = requester(identity)
      return eventJson(reachEvent(asker, eventId, { write: false }), asker)
    },

    /**
     * `PATCH /events/:id` (PROJ-182): an Owner or the Super admin edits name, place and period, a
     * Finished event too; what is left out stays.
     */
    async updateEvent(identity: VerifiedIdentity | null, eventId: number, body: EventBody) {
      await delay()
      const asker = requester(identity)
      const row = reachEvent(asker, eventId, { write: true })
      const { name, place, period } = checkEventBody(body, { partial: true })
      if (name !== undefined) row.name = name
      if (place !== undefined) row.place = place
      if (period !== undefined) Object.assign(row, period)
      return eventJson(row, asker)
    },

    /** A sample User as `GET /me` would return it, for Demo mode. */
    user(id: number) {
      const found = data.users.find((u) => u.id === id)
      if (!found) throw notFound()
      return userJson(found)
    },
  }
}
