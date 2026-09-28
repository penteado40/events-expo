import { useCallback } from 'react'

import { useSession } from '@/shared/session'

import { createDemoSession } from '../api'

/** "Modo demo": opens a Session as the demo user. Never reads or writes the saved email. */
export function useEnterDemo() {
  return useCallback(() => useSession.getState().signIn(createDemoSession()), [])
}
