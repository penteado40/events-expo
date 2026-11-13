/**
 * A Demo build (`EXPO_PUBLIC_DEMO_BUILD=true`, ADR-0005): a release bundle that runs only in Demo
 * mode, over the mock backend: no events-api, no Clerk. Kept for a backend-less preview
 * (`npm run build:demo:web`); no deploy uses it. Read as a literal so Expo inlines it at build time.
 */
export const DEMO_BUILD = process.env.EXPO_PUBLIC_DEMO_BUILD === 'true'
