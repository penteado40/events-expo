type Options = {
  /** Development build (`__DEV__`). */
  isDev: boolean
}

/**
 * Clerk's publishable key: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (see `.env.example`). A development
 * build without it runs with no Clerk, Demo mode only; a release build without it throws, so a
 * misconfigured build fails at startup.
 */
export function resolveClerkKey(fromEnv: string | undefined, { isDev }: Options): string | null {
  if (fromEnv) return fromEnv
  if (isDev) return null
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set: the app signs in through Clerk.')
}

/** Read as a literal `process.env.EXPO_PUBLIC_…` so Expo inlines it at build time. */
export const CLERK_PUBLISHABLE_KEY = resolveClerkKey(
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  { isDev: __DEV__ },
)
