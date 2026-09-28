import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { secureJSONStorage } from './secure-storage'

type LastEmailState = {
  /** The email last used to sign in through "Entrar"; kept after "Sair". Demo mode never touches it. */
  email: string
  hydrated: boolean
  setEmail: (email: string) => void
}

export function createLastEmailStore() {
  const store = create<LastEmailState>()(
    persist(
      (set) => ({
        email: '',
        hydrated: false,
        setEmail: (email) => set({ email }),
      }),
      {
        name: 'lastEmail',
        storage: secureJSONStorage,
        partialize: (state) => ({ email: state.email }),
        // Deferred: with synchronous storage (web) this runs before `store` is assigned.
        onRehydrateStorage: () => () => queueMicrotask(() => store.setState({ hydrated: true })),
      },
    ),
  )
  return store
}
