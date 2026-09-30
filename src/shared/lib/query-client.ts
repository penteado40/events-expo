import { focusManager, QueryClient } from '@tanstack/react-query'
import { AppState } from 'react-native'

import { useSession } from '@/shared/session'

import { ApiError, type ApiErrorCode, type KnownApiErrorCode } from './api-error'

const TRANSIENT: ReadonlySet<ApiErrorCode> = new Set<KnownApiErrorCode>([
  'NETWORK',
  'INTERNAL_ERROR',
])

/** Queries retry once, and only when the failure may be transient; everything else fails at once. */
export const shouldRetry = (failureCount: number, error: unknown) =>
  failureCount < 1 && error instanceof ApiError && TRANSIENT.has(error.code)

/** Data counts as fresh for 30 s; after that a remount or a return to the app refetches it. */
const STALE_TIME_MS = 30_000

/** Mutations (login, verify/reject) never retry automatically. */
export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: STALE_TIME_MS },
      mutations: { retry: false },
    },
  })

/**
 * React Native has no window focus: tell TanStack Query the app is focused while it is in the
 * foreground, so stale queries refetch on return (e.g. back from the bank app).
 */
export const refetchOnAppFocus = () =>
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) =>
      setFocused(state === 'active'),
    )
    return () => subscription.remove()
  })

/** "Sair" and expiry both end the Session, and its cached data goes with it. Returns the unsubscribe. */
export const clearCacheOnSignOut = (client: QueryClient) =>
  useSession.subscribe((state, previous) => {
    if (previous.session && !state.session) client.clear()
  })
