import { QueryClient } from '@tanstack/react-query'

import { useSession } from '@/shared/session'

import { ApiError, type ApiErrorCode, type KnownApiErrorCode } from './api-error'

const TRANSIENT: ReadonlySet<ApiErrorCode> = new Set<KnownApiErrorCode>([
  'NETWORK',
  'INTERNAL_ERROR',
])

/** Queries retry once, and only when the failure may be transient; everything else fails at once. */
export const shouldRetry = (failureCount: number, error: unknown) =>
  failureCount < 1 && error instanceof ApiError && TRANSIENT.has(error.code)

/** Mutations (login, verify/reject) never retry automatically. */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: shouldRetry }, mutations: { retry: false } },
  })

/** "Sair" and expiry both end the Session, and its cached data goes with it. Returns the unsubscribe. */
export const clearCacheOnSignOut = (client: QueryClient) =>
  useSession.subscribe((state, previous) => {
    if (previous.session && !state.session) client.clear()
  })
