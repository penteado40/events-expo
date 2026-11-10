import { ApiError } from '@/shared/lib/api-error'

import {
  createMockBackend,
  notFound,
  type MeChanges,
  type MockBackend,
  type NewViewerBody,
  type VerifiedIdentity,
} from './backend'

/** The base URL tests serve the fake API from. */
export const BASE_URL = 'http://api.test/api/v1'

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  USER_NOT_INVITED: 401,
  USER_DEACTIVATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  USER_ALREADY_ACTIVE: 409,
  ALREADY_A_GROUP_MEMBER: 409,
  SUPER_ADMIN_NOT_A_GROUP_MEMBER: 409,
}

const noContent = () => new Response(null, { status: 204 })

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
      const groupEvents = route.match(/^GET \/groups\/(\d+)\/events$/)
      if (groupEvents) {
        return json(200, { data: await backend.groupEvents(identity, Number(groupEvents[1])) })
      }
      const groupMembers = route.match(/^GET \/groups\/(\d+)\/members$/)
      if (groupMembers) {
        return json(200, { data: await backend.groupMembers(identity, Number(groupMembers[1])) })
      }
      const groupTeams = route.match(/^GET \/groups\/(\d+)\/teams$/)
      if (groupTeams) {
        return json(200, { data: await backend.groupTeams(identity, Number(groupTeams[1])) })
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
      const teamMember = route.match(/^PUT \/groups\/(\d+)\/teams\/(\d+)\/members\/(\d+)$/)
      if (teamMember) {
        const [, groupId, teamId, userId] = teamMember.map(Number)
        await backend.addTeamMember(identity, groupId, teamId, userId)
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
