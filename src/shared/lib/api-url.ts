const DEV_DEFAULT = 'http://localhost:3000/api/v1'

type Options = {
  /** Development build (`__DEV__`). */
  isDev: boolean
}

/**
 * The events-api base URL: `EXPO_PUBLIC_API_URL` (see `.env.example`), or localhost in a
 * development build. A release build without it throws, so a misconfigured build fails at startup.
 */
export function resolveApiUrl(fromEnv: string | undefined, { isDev }: Options): string {
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  if (isDev) return DEV_DEFAULT
  throw new Error('EXPO_PUBLIC_API_URL is not set: a release build needs the events-api URL.')
}
