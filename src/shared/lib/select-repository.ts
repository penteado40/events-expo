import { useSession } from '@/shared/session'

import { LIVE_MODULES, type DataModule } from './live-modules'

type Options = {
  /** Development build (`__DEV__`). */
  isDev?: boolean
  liveModules?: readonly DataModule[]
}

/**
 * The mock-vs-HTTP rule every feature's `api.ts` uses: Demo mode → mock; a module outside
 * LIVE_MODULES → mock; otherwise HTTP. A release build never uses the mock. Decided on every
 * call, so the answer follows the current Session (e.g. "Entrar" before any Session exists).
 */
export function selectRepository<T extends object>(
  module: DataModule,
  implementations: { http: T; mock: T },
  { isDev = __DEV__, liveModules = LIVE_MODULES }: Options = {},
): T {
  const current = (): T => {
    const demoMode = useSession.getState().session?.live === false
    const useMock = isDev && (demoMode || !liveModules.includes(module))
    return useMock ? implementations.mock : implementations.http
  }

  const methods = Object.keys(implementations.http).map((name) => [
    name,
    (...args: unknown[]) =>
      (current() as Record<string, (...a: unknown[]) => unknown>)[name](...args),
  ])
  return Object.fromEntries(methods) as T
}
