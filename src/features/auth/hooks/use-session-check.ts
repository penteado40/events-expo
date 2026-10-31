import { useEffect } from 'react'

import { ApiError } from '@/shared/lib/api-error'
import { expireSession, isSessionEndReason, useSession } from '@/shared/session'

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
    // Over HTTP the client already expired it; the mock (`auth` not live yet) has no client.
    if (error instanceof ApiError && isSessionEndReason(error.code)) {
      expireSession(session.id, error.code)
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
