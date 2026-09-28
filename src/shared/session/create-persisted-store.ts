import { create, type StateCreator } from 'zustand'
import { persist, type PersistOptions } from 'zustand/middleware'

import { secureJSONStorage } from './secure-storage'

type Options<T, P> = Pick<PersistOptions<T, P>, 'name' | 'partialize' | 'merge'>

/**
 * A Zustand store persisted in SecureStore whose `hydrated` flips to true once storage has been
 * read, also on a read error, so the splash never hangs.
 */
export function createPersistedStore<T extends { hydrated: boolean }, P>(
  initializer: StateCreator<T, [['zustand/persist', unknown]]>,
  options: Options<T, P>,
) {
  const store = create<T>()(
    persist(initializer, {
      ...options,
      storage: secureJSONStorage,
      // Deferred: with synchronous storage (web) this runs before `store` is assigned.
      onRehydrateStorage: () => () =>
        queueMicrotask(() => store.setState({ hydrated: true } as Partial<T>)),
    }),
  )
  return store
}
