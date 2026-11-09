import { ApiError } from '@/shared/lib/api-error'

import {
  createMockBackend,
  notFound,
  type EventBody,
  type MeChanges,
  type MockBackend,
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
      throw notFound()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      const { code, message, details } = error
      return json(STATUS_BY_CODE[code] ?? 500, { error: { code, message, details } })
    }
  }
}
