import { useCallback } from 'react'

import { useSession } from '@/shared/session'

/**
 * "Sair": ends the Session. Its cache and the Clerk session go with it (`clearCacheOnSignOut`,
 * `endIdentityWithSession`, set up in the root layout).
 */
export function useSignOut() {
  return useCallback(() => useSession.getState().signOut(), [])
}
