import { useEffect } from 'react'

import { ApiError } from '@/shared/lib/api-error'
import { expireSession, useSession } from '@/shared/session'

import { authRepository } from '../api'

/**
 * Refreshes a saved Live session's User from `GET /me`. A refused Session (Clerk no longer has it,
 * or the User was deactivated) ends with its reason; `NETWORK` or any other error keeps it
 * silently.
 */
export async function checkSession(repository = authRepository) {
  const session = useSession.getState().session
  if (!session?.live) return
  try {
    useSession.getState().updateUser(session.id, await repository.me())
  } catch (error) {
    // The HTTP client already expired it; a module still on the mock (no HTTP) reaches here.
    if (error instanceof ApiError && error.code === 'UNAUTHENTICATED') {
      expireSession(session.id, 'UNAUTHENTICATED')
    } else if (error instanceof ApiError && error.code === 'USER_DEACTIVATED') {
      expireSession(session.id, 'USER_DEACTIVATED')
    }
    // Anything else keeps it: the app stays usable offline, and the next request tells the truth.
  }
}

let checked = false

/** Once per cold start, after the Session store hydrates: the optimistic startup's background check. */
export function useSessionCheck(ready: boolean) {
  useEffect(() => {
    if (!ready || checked) return
    checked = true
    checkSession()
  }, [ready])
}
