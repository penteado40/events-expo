import { ApiError } from '@/shared/lib/api-error'

import {
  createMockBackend,
  notFound,
  type EventBody,
  type EventItemBody,
  type FieldOrderBody,
  type ItemFieldBody,
  type MeChanges,
  type MockBackend,
  type NewViewerBody,
  type TeamBody,
  type VerifiedIdentity,
} from './backend'

/** The base URL tests serve the fake API from. */
export const BASE_URL = 'http://api.test/api/v1'

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  USER_NOT_INVITED: 401,
  USER_DEACTIVATED: 401,
  EVENT_PERIOD_INVALID: 400,
  EVENT_ITEM_TIME_WITHOUT_DATE: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  USER_ALREADY_ACTIVE: 409,
  ALREADY_A_GROUP_MEMBER: 409,
  SUPER_ADMIN_NOT_A_GROUP_MEMBER: 409,
  TEAM_NAME_TAKEN: 409,
  EVENT_CANCELLED: 409,
  EVENT_ITEM_NOT_DRAFT: 409,
  EVENT_ITEM_NOT_PUBLISHED: 409,
  EVENT_ITEM_CANCELLED: 409,
  EVENT_ITEM_NOT_CANCELLED: 409,
  NOT_A_PARTICIPANT: 409,
}

const noContent = () => new Response(null, { status: 204 })

type MockField = {
  type: string
  value?: string
  people?: { userId: number | null; name: string }[]
  [key: string]: unknown
}

/**
 * The events-api's Field body (PROJ-198, PROJ-201) put into the mock backend's: `kind` is the
 * `type`. Its people come as `{ userId }` or `{ name }`, as the backend takes them.
 */
function fieldBodyFromApi(raw: Record<string, unknown>): ItemFieldBody {
  const { kind, ...rest } = raw
  return (kind === undefined ? rest : { ...rest, type: kind }) as ItemFieldBody
}

/**
 * A Field as the events-api answers it: `kind`, and a Field of people's people in `value`, a User
 * as `{ userId, name }` and a loose name as `{ name }`. The API has no Highlight nor Personal
 * notes yet, so they are left out, as is who left the Event.
 */
function fieldToApi(field: MockField) {
  const value =
    field.type === 'PEOPLE'
      ? (field.people ?? []).map(({ userId, name }) =>
          userId === null ? { name } : { userId, name },
        )
      : field.value
  return { id: field.id, kind: field.type, name: field.name, value }
}

/** An Event item as the events-api answers it, its Fields in the API's shape. */
function itemToApi<T extends object>(item: T): T {
  const fields = (item as { fields?: MockField[] }).fields
  return fields ? { ...item, fields: fields.map(fieldToApi) } : item
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/**
 * The fake AuthVerifier: accepts the tokens the fake Clerk issues (`clerk:<email>`), as the
 * events-api's own fake accepts tokens built by its tests.
 */
function verify(token: string | null): VerifiedIdentity | null {
  const email = token?.match(/^clerk:(.+)$/)?.[1]
  return email ? { email } : null
}

type Options = { baseUrl?: string; backend?: MockBackend }

/**
 * A stand-in for the events-api over `fetch`, for tests: serves the mock backend with the API's
 * routes and envelopes, so each contract suite runs against the HTTP repository too.
 */
export function createFakeApi({
  baseUrl = BASE_URL,
  backend = createMockBackend(),
}: Options = {}): typeof fetch {
  return async (input, init) => {
    const path = String(input).slice(baseUrl.length)
    const method = init?.method ?? 'GET'
    const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization
    const identity = verify(authorization?.replace(/^Bearer /, '') ?? null)

    try {
      const route = `${method} ${path}`
      if (route === 'GET /me') return json(200, { data: await backend.me(identity) })
      if (route === 'PATCH /me') {
        const body = JSON.parse(String(init?.body ?? '{}')) as MeChanges
        return json(200, { data: await backend.updateMe(identity, body) })
      }
      if (route === 'GET /groups') return json(200, { data: await backend.groups(identity) })
      const body = () => JSON.parse(String(init?.body ?? '{}')) as EventBody
      const groupEvents = route.match(/^(GET|POST) \/groups\/(\d+)\/events$/)
      if (groupEvents?.[1] === 'GET') {
        return json(200, { data: await backend.groupEvents(identity, Number(groupEvents[2])) })
      }
      if (groupEvents?.[1] === 'POST') {
        const created = await backend.createEvent(identity, Number(groupEvents[2]), body())
        return json(201, { data: created })
      }
      const event = route.match(/^(GET|PATCH) \/events\/(\d+)$/)
      if (event?.[1] === 'GET') {
        return json(200, { data: await backend.event(identity, Number(event[2])) })
      }
      if (event?.[1] === 'PATCH') {
        return json(200, { data: await backend.updateEvent(identity, Number(event[2]), body()) })
      }
      const itemBody = () => JSON.parse(String(init?.body ?? '{}')) as EventItemBody
      const items = route.match(/^POST \/events\/(\d+)\/items$/)
      if (items) {
        return json(201, { data: await backend.createItem(identity, Number(items[1]), itemBody()) })
      }
      const item = route.match(/^(PATCH|DELETE) \/events\/(\d+)\/items\/(\d+)$/)
      if (item?.[1] === 'PATCH') {
        const edited = await backend.updateItem(
          identity,
          Number(item[2]),
          Number(item[3]),
          itemBody(),
        )
        return json(200, { data: edited })
      }
      if (item?.[1] === 'DELETE') {
        await backend.deleteItem(identity, Number(item[2]), Number(item[3]))
        return noContent()
      }
      const lifecycle = route.match(
        /^POST \/events\/(\d+)\/items\/(\d+)\/(publish|cancel|uncancel)$/,
      )
      if (lifecycle) {
        const [eventId, itemId] = lifecycle.slice(1, 3).map(Number)
        const move = {
          publish: 'publishItem',
          cancel: 'cancelItem',
          uncancel: 'uncancelItem',
        } as const
        const moved = await backend[move[lifecycle[3] as keyof typeof move]](
          identity,
          eventId,
          itemId,
        )
        return json(200, { data: moved })
      }
      const fieldBody = () =>
        fieldBodyFromApi(JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>)
      const fields = route.match(/^POST \/events\/(\d+)\/items\/(\d+)\/fields$/)
      if (fields) {
        const [eventId, itemId] = fields.slice(1).map(Number)
        const added = await backend.addField(identity, eventId, itemId, fieldBody())
        return json(201, { data: fieldToApi(added as unknown as MockField) })
      }
      const order = route.match(/^PUT \/events\/(\d+)\/items\/(\d+)\/fields\/order$/)
      if (order) {
        const [eventId, itemId] = order.slice(1).map(Number)
        const orderBody = JSON.parse(String(init?.body ?? '{}')) as FieldOrderBody
        await backend.orderFields(identity, eventId, itemId, orderBody)
        return noContent()
      }
      const field = route.match(/^(PATCH|DELETE) \/events\/(\d+)\/items\/(\d+)\/fields\/(\d+)$/)
      if (field) {
        const [eventId, itemId, fieldId] = field.slice(2).map(Number)
        if (field[1] === 'DELETE') {
          await backend.deleteField(identity, eventId, itemId, fieldId)
          return noContent()
        }
        const edited = await backend.updateField(identity, eventId, itemId, fieldId, fieldBody())
        return json(200, { data: fieldToApi(edited as unknown as MockField) })
      }
      const schedule = route.match(/^GET \/events\/(\d+)\/schedule$/)
      if (schedule) {
        const { generalInfo, timeline } = await backend.schedule(identity, Number(schedule[1]))
        return json(200, {
          data: {
            generalInfo: generalInfo.map(itemToApi),
            timeline: timeline.map((day) => ({ ...day, items: day.items.map(itemToApi) })),
          },
        })
      }
      const participants = route.match(/^GET \/events\/(\d+)\/participants$/)
      if (participants) {
        return json(200, { data: await backend.participants(identity, Number(participants[1])) })
      }
      const participant = route.match(/^(PUT|DELETE) \/events\/(\d+)\/participants\/(\d+)$/)
      if (participant) {
        const [eventId, userId] = participant.slice(2).map(Number)
        if (participant[1] === 'PUT') await backend.addParticipant(identity, eventId, userId)
        else await backend.removeParticipant(identity, eventId, userId)
        return noContent()
      }
      const groupMembers = route.match(/^GET \/groups\/(\d+)\/members$/)
      if (groupMembers) {
        return json(200, { data: await backend.groupMembers(identity, Number(groupMembers[1])) })
      }
      const teamBody = () => JSON.parse(String(init?.body ?? '{}')) as TeamBody
      const groupTeams = route.match(/^(GET|POST) \/groups\/(\d+)\/teams$/)
      if (groupTeams?.[1] === 'GET') {
        return json(200, { data: await backend.groupTeams(identity, Number(groupTeams[2])) })
      }
      if (groupTeams?.[1] === 'POST') {
        const created = await backend.createTeam(identity, Number(groupTeams[2]), teamBody())
        return json(201, { data: created })
      }
      const team = route.match(/^(PATCH|DELETE) \/groups\/(\d+)\/teams\/(\d+)$/)
      if (team?.[1] === 'PATCH') {
        const renamed = await backend.renameTeam(
          identity,
          Number(team[2]),
          Number(team[3]),
          teamBody(),
        )
        return json(200, { data: renamed })
      }
      if (team?.[1] === 'DELETE') {
        await backend.deleteTeam(identity, Number(team[2]), Number(team[3]))
        return noContent()
      }
      const viewers = route.match(/^POST \/groups\/(\d+)\/viewers$/)
      if (viewers) {
        const body = JSON.parse(String(init?.body ?? '{}')) as NewViewerBody
        return json(201, { data: await backend.addViewer(identity, Number(viewers[1]), body) })
      }
      const link = route.match(/^POST \/groups\/(\d+)\/members\/(\d+)\/activation-link$/)
      if (link) {
        const [, groupId, userId] = link.map(Number)
        return json(201, { data: await backend.reissueActivationLink(identity, groupId, userId) })
      }
      const viewer = route.match(/^DELETE \/groups\/(\d+)\/viewers\/(\d+)$/)
      if (viewer) {
        await backend.removeViewer(identity, Number(viewer[1]), Number(viewer[2]))
        return noContent()
      }
      const teamMember = route.match(/^(PUT|DELETE) \/groups\/(\d+)\/teams\/(\d+)\/members\/(\d+)$/)
      if (teamMember) {
        const [groupId, teamId, userId] = teamMember.slice(2).map(Number)
        if (teamMember[1] === 'PUT') await backend.addTeamMember(identity, groupId, teamId, userId)
        else await backend.removeTeamMember(identity, groupId, teamId, userId)
        return noContent()
      }
      throw notFound()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      const { code, message, details } = error
      return json(STATUS_BY_CODE[code] ?? 500, { error: { code, message, details } })
    }
  }
}
