import { useCallback } from 'react'

import { useSession } from '@/shared/session'

import { createDemoSession, type DemoAccount } from '../api'

/** "Modo demo" (development builds only): opens a Session as the chosen sample User. */
export function useEnterDemo() {
  return useCallback(
    (account: DemoAccount) => useSession.getState().signIn(createDemoSession(account)),
    [],
  )
}
