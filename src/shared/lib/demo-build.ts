/**
 * A Demo build (`EXPO_PUBLIC_DEMO_BUILD=true`): a release bundle published as a preview (the web on
 * Vercel, the app in Expo Go through EAS Update; see docs/previews.md). It runs only in Demo mode,
 * over the mock backend: no events-api, no Clerk. Read as a literal so Expo inlines it at build
 * time.
 */
export const DEMO_BUILD = process.env.EXPO_PUBLIC_DEMO_BUILD === 'true'
