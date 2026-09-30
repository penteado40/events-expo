import { ApiError } from '@/shared/lib/api-error'
import type { User } from '@/shared/session'

import { createMockBackend, notFound, type MockBackend } from './backend'

/** The base URL tests serve the fake API from. */
export const BASE_URL = 'http://api.test/api/v1'

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

type Options = { baseUrl?: string; backend?: MockBackend }

/**
 * A stand-in for the events-api over `fetch`, for tests: serves the mock backend with the API's
 * routes and envelopes, so each contract suite runs against the HTTP repository too.
 */
export function createFakeApi({
  baseUrl = BASE_URL,
  backend = createMockBackend(),
}: Options = {}): typeof fetch {
  // `GET /events/:id/<collection>`.
  const collections = new Map<string, (requester: User, eventId: number) => Promise<unknown>>([
    ['members', backend.listMembers],
    ['rsvps', backend.listRsvps],
    ['contributions', backend.listContributions],
  ])

  return async (input, init) => {
    const path = String(input).slice(baseUrl.length)
    const method = init?.method ?? 'GET'
    const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization
    const token = authorization?.replace(/^Bearer /, '') ?? null

    try {
      const route = `${method} ${path}`
      if (route === 'POST /auth/login') {
        return json(200, { data: await backend.login(JSON.parse(String(init?.body))) })
      }
      if (route === 'GET /me') return json(200, { data: await backend.me(token) })
      // The API's auth guard: the token names the requester.
      const requester = await backend.me(token)
      if (route === 'GET /events') return json(200, { data: await backend.listEvents(requester) })
      const eventId = route.match(/^GET \/events\/([^/]+)$/)?.[1]
      if (eventId !== undefined) {
        return json(200, { data: await backend.getEvent(requester, Number(eventId)) })
      }
      const [, id, collection] = route.match(/^GET \/events\/([^/]+)\/([^/]+)$/) ?? []
      const list = collection === undefined ? undefined : collections.get(collection)
      if (list) return json(200, { data: await list(requester, Number(id)) })
      throw notFound()
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      const { code, message, details } = error
      return json(STATUS_BY_CODE[code] ?? 500, { error: { code, message, details } })
    }
  }
}
