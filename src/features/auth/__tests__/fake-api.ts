import { ApiError } from '@/shared/lib/api-error'

import { createMockAuthRepository } from '../mock'

export const BASE_URL = 'http://api.test/api/v1'

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  INVALID_CREDENTIALS: 401,
  UNAUTHENTICATED: 401,
  NOT_FOUND: 404,
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/**
 * A stand-in for the events-api auth endpoints: serves the mock over HTTP with the API's envelopes,
 * so the same contract suite can run against the HTTP repository.
 */
export function createFakeApi(baseUrl = BASE_URL): typeof fetch {
  return async (input, init) => {
    const path = String(input).slice(baseUrl.length)
    const method = init?.method ?? 'GET'
    const authorization = (init?.headers as Record<string, string> | undefined)?.Authorization
    const token = authorization?.replace(/^Bearer /, '') ?? null
    const repo = createMockAuthRepository({ getToken: () => token })

    try {
      if (method === 'POST' && path === '/auth/login') {
        return json(200, { data: await repo.login(JSON.parse(String(init?.body))) })
      }
      if (method === 'GET' && path === '/me') return json(200, { data: await repo.me() })
      throw new ApiError('NOT_FOUND', 'Recurso não encontrado.')
    } catch (error) {
      if (!(error instanceof ApiError)) throw error
      const { code, message, details } = error
      return json(STATUS_BY_CODE[code] ?? 500, { error: { code, message, details } })
    }
  }
}
