import { z } from 'zod'

import { createPersistedStore } from './create-persisted-store'
import { userSchema, type User } from './user'

/**
 * Who is signed in on this device and how (see CONTEXT.md). `live` = backed by the real events-api.
 * `id` names this Session: the Clerk session's id in a Live session. The token stays with Clerk.
 */
const sessionSchema = z.object({ id: z.string().min(1), user: userSchema, live: z.boolean() })

export type Session = z.infer<typeof sessionSchema>

/** Why the last Session ended without "Sair", for the login screen to say. */
export type SessionEndReason = 'UNAUTHENTICATED' | 'USER_DEACTIVATED'

type SessionState = {
  session: Session | null
  /** Set when the API ended the Session; cleared by the next sign-in. Never persisted. */
  endedBecause: SessionEndReason | null
  /** True once the stored Session has been read from SecureStore. */
  hydrated: boolean
  signIn: (session: Session) => void
  signOut: () => void
  /**
   * Ends the Session `id` because the API refused it. Only if it is still the current one: however
   * many requests fail in parallel it clears once, and a late failure never ends a newer Session.
   */
  expire: (id: string | null, reason: SessionEndReason) => void
  /** Replaces the stored User with fresh `GET /me` data, if the Session `id` is still open. */
  updateUser: (id: string, user: User) => void
}

type Options = {
  /** Development build (`__DEV__`); only there can a Session without an API behind it exist. */
  isDev?: boolean
}

export function createSessionStore({ isDev = __DEV__ }: Options = {}) {
  return createPersistedStore<SessionState, Pick<SessionState, 'session'>>(
    (set) => ({
      session: null,
      endedBecause: null,
      hydrated: false,
      signIn: (session) => set({ session, endedBecause: null }),
      signOut: () => set({ session: null }),
      expire: (id, reason) =>
        set((state) =>
          id !== null && state.session?.id === id ? { session: null, endedBecause: reason } : state,
        ),
      updateUser: (id, user) =>
        set((state) =>
          state.session?.id === id ? { session: { ...state.session, user } } : state,
        ),
    }),
    {
      name: 'session',
      partialize: (state) => ({ session: state.session }),
      merge: (persisted, current) => {
        // A malformed keychain entry (or a V1 Session) starts the app signed out instead of
        // restoring garbage.
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
