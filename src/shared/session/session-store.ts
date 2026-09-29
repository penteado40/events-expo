import { z } from 'zod'

import { createPersistedStore } from './create-persisted-store'
import { userSchema, type User } from './user'

/** Who is signed in on this device and how (see CONTEXT.md). `live` = backed by the real events-api. */
const sessionSchema = z.object({ token: z.string().min(1), user: userSchema, live: z.boolean() })

export type Session = z.infer<typeof sessionSchema>

type SessionState = {
  session: Session | null
  /** True once the stored Session has been read from SecureStore. */
  hydrated: boolean
  signIn: (session: Session) => void
  signOut: () => void
  /**
   * Ends the Session because the API refused `token`. Only if it is still the current one: however
   * many requests fail in parallel it clears once, and a late failure never ends a newer Session.
   */
  expire: (token: string | null) => void
  /** Replaces the stored User with fresh `GET /me` data, if the Session behind `token` is still open. */
  updateUser: (token: string, user: User) => void
}

type Options = {
  /** Development build (`__DEV__`); only there can a Session without an API behind it exist. */
  isDev?: boolean
}

export function createSessionStore({ isDev = __DEV__ }: Options = {}) {
  return createPersistedStore<SessionState, Pick<SessionState, 'session'>>(
    (set) => ({
      session: null,
      hydrated: false,
      signIn: (session) => set({ session }),
      signOut: () => set({ session: null }),
      expire: (token) =>
        set((state) => (state.session?.token === token ? { session: null } : state)),
      updateUser: (token, user) =>
        set((state) =>
          state.session?.token === token ? { session: { ...state.session, user } } : state,
        ),
    }),
    {
      name: 'session',
      partialize: (state) => ({ session: state.session }),
      merge: (persisted, current) => {
        // A malformed keychain entry starts the app signed out instead of restoring garbage.
        const stored = sessionSchema.safeParse(
          (persisted as { session?: unknown } | undefined)?.session,
        )
        const session = stored.success ? stored.data : null
        // Only a development build can open one without an API behind it (Demo mode), so a
        // release build drops any it finds.
        return { ...current, session: session && !session.live && !isDev ? null : session }
      },
    },
  )
}
