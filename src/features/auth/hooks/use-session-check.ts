import { useEffect } from 'react'

import { useSession } from '@/shared/session'

import { authRepository } from '../api'

/**
 * Refreshes a saved Live session's User from `GET /me`. `UNAUTHENTICATED` has already expired the
 * Session in the HTTP client; `NETWORK` or any other error keeps it silently.
 */
export async function checkSession(repository = authRepository) {
  const session = useSession.getState().session
  if (!session?.live) return
  try {
    useSession.getState().updateUser(session.token, await repository.me())
  } catch {
    // Kept: the app stays usable offline, and the next request tells the truth.
  }
}

let checked = false

/** Once per cold start, after the stores hydrate: the optimistic startup's background check. */
export function useSessionCheck(ready: boolean) {
  useEffect(() => {
    if (!ready || checked) return
    checked = true
    checkSession()
  }, [ready])
}
