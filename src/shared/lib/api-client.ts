import { expireSession, useSession } from '@/shared/session'

import { resolveApiUrl } from './api-url'
import { createHttpClient } from './http'

/** Read as a literal `process.env.EXPO_PUBLIC_…` so Expo inlines it at build time. */
export const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, { isDev: __DEV__ })

/** The events-api client of every HTTP repository: the Session's token, and `UNAUTHENTICATED` ends it. */
export const apiClient = createHttpClient({
  baseUrl: API_URL,
  getToken: () => useSession.getState().session?.token ?? null,
  onUnauthenticated: expireSession,
})
