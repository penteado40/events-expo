import { z } from 'zod'

import { ApiError, internalError } from './api-error'

const TIMEOUT_MS = 15_000

const errorEnvelope = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
const dataEnvelope = z.object({ data: z.unknown() })

type Options = {
  baseUrl: string
  /** The Session's token, sent as `Authorization: Bearer`. */
  getToken: () => string | null
  /** Called with the token that was refused when the API answers `UNAUTHENTICATED`. */
  onUnauthenticated?: (token: string | null) => void
  fetch?: typeof fetch
  timeoutMs?: number
}

type RequestOptions<T> = {
  body?: unknown
  /** Validates the envelope's `data`; a mismatch is an `INTERNAL_ERROR`. */
  schema: z.ZodType<T>
  /** Sent instead of the Session's token (e.g. right after login, before the Session exists). */
  token?: string
}

export type HttpClient = ReturnType<typeof createHttpClient>

/** The client every HTTP repository uses: unwraps `{ data }` and throws every failure as `ApiError`. */
export function createHttpClient({
  baseUrl,
  getToken,
  onUnauthenticated,
  // Looked up per call, so tests can stub the global.
  fetch: fetchFn = (...args) => fetch(...args),
  timeoutMs = TIMEOUT_MS,
}: Options) {
  async function request<T>(
    method: string,
    path: string,
    { body, schema, token = getToken() ?? undefined }: RequestOptions<T>,
  ): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let status: number
    let payload: unknown
    try {
      const response = await fetchFn(`${baseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
      status = response.status
      const text = await response.text()
      payload = parseJson(text)
    } catch (cause) {
      throw new ApiError(
        'NETWORK',
        'Não foi possível conectar. Verifique sua internet e tente de novo.',
        { cause },
      )
    } finally {
      clearTimeout(timer)
    }

    const failure = errorEnvelope.safeParse(payload)
    if (failure.success) {
      const { code, message, details } = failure.data.error
      // Only the code: a wrong password is a 401 too (`INVALID_CREDENTIALS`).
      if (code === 'UNAUTHENTICATED') onUnauthenticated?.(token ?? null)
      throw new ApiError(code, message, details)
    }
    const success = dataEnvelope.safeParse(payload)
    if (status < 200 || status >= 300 || !success.success) throw internalError({ status })
    const data = schema.safeParse(success.data.data)
    if (!data.success) throw internalError({ status, issues: data.error.issues })
    return data.data
  }

  return {
    get: <T>(path: string, options: RequestOptions<T>) => request('GET', path, options),
    post: <T>(path: string, options: RequestOptions<T>) => request('POST', path, options),
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
