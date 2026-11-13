import { DEMO_BUILD } from './demo-build'

type Options = {
  /** Development build (`__DEV__`). */
  isDev: boolean
  /** Demo build (`EXPO_PUBLIC_DEMO_BUILD`): a preview, Demo mode only. */
  demoBuild: boolean
}

/**
 * Clerk's publishable key: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (see `.env.example`). A development
 * build without it runs with no Clerk, Demo mode only; a release build without it throws, so a
 * misconfigured build fails at startup. A Demo build never uses Clerk, and refuses a live key so a
 * preview can't be built with production config.
 */
export function resolveClerkKey(
  fromEnv: string | undefined,
  { isDev, demoBuild }: Options,
): string | null {
  if (demoBuild) {
    if (fromEnv?.startsWith('pk_live_')) {
      throw new Error('A Demo build takes no pk_live_ Clerk key: unset it, or use a pk_test_ one.')
    }
    return null
  }
  if (fromEnv) return fromEnv
  if (isDev) return null
  throw new Error('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set: the app signs in through Clerk.')
}

/** Read as a literal `process.env.EXPO_PUBLIC_…` so Expo inlines it at build time. */
export const CLERK_PUBLISHABLE_KEY = resolveClerkKey(
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  { isDev: __DEV__, demoBuild: DEMO_BUILD },
)
