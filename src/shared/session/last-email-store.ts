import { createPersistedStore } from './create-persisted-store'

type LastEmailState = {
  /** The email last used to sign in through "Entrar"; kept after "Sair". Demo mode never touches it. */
  email: string
  hydrated: boolean
  setEmail: (email: string) => void
}

export function createLastEmailStore() {
  return createPersistedStore<LastEmailState, Pick<LastEmailState, 'email'>>(
    (set) => ({
      email: '',
      hydrated: false,
      setEmail: (email) => set({ email }),
    }),
    { name: 'lastEmail', partialize: (state) => ({ email: state.email }) },
  )
}
