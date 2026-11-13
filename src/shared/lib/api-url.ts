const DEV_DEFAULT = 'http://localhost:3000/api/v1'

type Options = {
  /** Development build (`__DEV__`). */
  isDev: boolean
  /** Demo build (`EXPO_PUBLIC_DEMO_BUILD`): a preview over the mock, never calling the API. */
  demoBuild: boolean
}

/**
 * The events-api base URL: `EXPO_PUBLIC_API_URL` (see `.env.example`), or localhost in a
 * development or Demo build. A release build without it throws, so a misconfigured build fails at
 * startup.
 */
export function resolveApiUrl(fromEnv: string | undefined, { isDev, demoBuild }: Options): string {
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  // A Demo build never calls it (only Demo mode, over the mock), so any placeholder would do.
  if (isDev || demoBuild) return DEV_DEFAULT
  throw new Error('EXPO_PUBLIC_API_URL is not set: a release build needs the events-api URL.')
}
