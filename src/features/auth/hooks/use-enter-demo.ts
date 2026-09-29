import { useCallback } from 'react'

import { useSession } from '@/shared/session'

import { createDemoSession, type DemoAccount } from '../api'

/** "Modo demo": opens a Session as the chosen demo user. Never reads or writes the saved email. */
export function useEnterDemo() {
  return useCallback(
    (account: DemoAccount) => useSession.getState().signIn(createDemoSession(account)),
    [],
  )
}
