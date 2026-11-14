import { expireSession, identity, useSession } from '@/shared/session'

import { resolveApiUrl } from './api-url'
import { DEMO_BUILD } from './demo-build'
import { createHttpClient } from './http'

/** Read as a literal `process.env.EXPO_PUBLIC_…` so Expo inlines it at build time. */
export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, {
  isDev: __DEV__,
  demoBuild: DEMO_BUILD,
})

/**
 * The events-api client of every HTTP repository: Clerk's token on each request, and a refused
 * Session (`UNAUTHENTICATED`, Deactivated user) ends it.
 */
export const apiClient = createHttpClient({
  baseUrl: API_URL,
  getToken: () => identity.getToken(),
  getSessionId: () => useSession.getState().session?.id ?? null,
  onSessionRefused: expireSession,
})
