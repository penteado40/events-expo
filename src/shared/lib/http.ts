import { z } from 'zod'

import { isSessionEndReason, type SessionEndReason } from '@/shared/session'

import { ApiError, internalError, networkError } from './api-error'

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
  /** The identity's token, sent as `Authorization: Bearer`; asked for on every request. */
  getToken: () => Promise<string | null>
  /** Names the Session a request runs in, read when it starts. */
  getSessionId?: () => string | null
  /**
   * Called when the API refuses the Session, with the id `getSessionId` gave when that request
   * started (so a late failure never ends a newer Session) and the code.
   */
  onSessionRefused?: (sessionId: string | null, code: SessionEndReason) => void
  fetch?: typeof fetch
  timeoutMs?: number
}

type RequestOptions<T> = {
  body?: unknown
  /** Validates the envelope's `data`; a mismatch is an `INTERNAL_ERROR`. */
  schema: z.ZodType<T>
}

/** A write whose answer has nothing to read (`204`, or a body the app ignores). */
type SendOptions = { body?: unknown }

export type HttpClient = ReturnType<typeof createHttpClient>

/** The client every HTTP repository uses: unwraps `{ data }` and throws every failure as `ApiError`. */
export function createHttpClient({
  baseUrl,
  getToken,
  getSessionId = () => null,
  onSessionRefused,
  // Looked up per call, so tests can stub the global.
  fetch: fetchFn = (...args) => fetch(...args),
  timeoutMs = TIMEOUT_MS,
}: Options) {
  async function request<T>(
    method: string,
    path: string,
    { body, schema }: { body?: unknown; schema: z.ZodType<T> | null },
  ): Promise<T> {
    const sessionId = getSessionId()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    let status: number
    let payload: unknown
    try {
      const token = await getToken()
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
      throw networkError(cause)
    } finally {
      clearTimeout(timer)
    }

    const failure = errorEnvelope.safeParse(payload)
    if (failure.success) {
      const { code, message, details } = failure.data.error
      if (isSessionEndReason(code)) onSessionRefused?.(sessionId, code)
      throw new ApiError(code, message, details)
    }
    if (status < 200 || status >= 300) throw internalError({ status })
    if (schema === null) return undefined as T
    const success = dataEnvelope.safeParse(payload)
    if (!success.success) throw internalError({ status })
    const data = schema.safeParse(success.data.data)
    if (!data.success) throw internalError({ status, issues: data.error.issues })
    return data.data
  }

  return {
    get: <T>(path: string, options: RequestOptions<T>) => request('GET', path, options),
    post: <T>(path: string, options: RequestOptions<T>) => request('POST', path, options),
    patch: <T>(path: string, options: RequestOptions<T>) => request('PATCH', path, options),
    /** A write with nothing to read back. */
    send: (method: 'POST' | 'PUT' | 'DELETE', path: string, { body }: SendOptions = {}) =>
      request<void>(method, path, { body, schema: null }),
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}
