import { useSession } from '@/shared/session'

import { DEMO_BUILD } from './demo-build'
import { LIVE_MODULES, type DataModule } from './live-modules'

type Options = {
  /** Development build (`__DEV__`). */
  isDev?: boolean
  /** Demo build (`EXPO_PUBLIC_DEMO_BUILD`): a preview, Demo mode only. */
  demoBuild?: boolean
  liveModules?: readonly DataModule[]
}

/**
 * The mock-vs-HTTP rule every feature's `api.ts` uses: Demo mode → mock; a module outside
 * LIVE_MODULES → mock; otherwise HTTP. A Demo build always uses the mock; any other release build
 * never does. Decided on every call, so the answer follows the current Session (e.g. a sign-in
 * before any Session exists).
 */
export function selectRepository<T extends object>(
  module: DataModule,
  implementations: { http: T; mock: T },
  { isDev = __DEV__, demoBuild = DEMO_BUILD, liveModules = LIVE_MODULES }: Options = {},
): T {
  const current = (): T => {
    const demoMode = useSession.getState().session?.live === false
    const useMock = demoBuild || (isDev && (demoMode || !liveModules.includes(module)))
    return useMock ? implementations.mock : implementations.http
  }

  const methods = Object.keys(implementations.http).map((name) => [
    name,
    (...args: unknown[]) =>
      (current() as Record<string, (...a: unknown[]) => unknown>)[name](...args),
  ])
  return Object.fromEntries(methods) as T
}
