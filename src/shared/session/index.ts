import { clerkIdentity, type Identity } from './identity'
import { createSessionStore, type SessionEndReason } from './session-store'

export type { Identity } from './identity'
export type { Session, SessionEndReason } from './session-store'
export type { GroupMembership, User } from './user'
export { groupMembershipSchema, userSchema } from './user'

/** The device's Session (CONTEXT.md). */
export const useSession = createSessionStore()

/** The person's Clerk identity; the Session's token comes from it. */
export const identity: Identity = clerkIdentity

/** Ends the Session the API refused (`UNAUTHENTICATED`, or the User was deactivated). */
export const expireSession = (id: string | null, reason: SessionEndReason) =>
  useSession.getState().expire(id, reason)

/**
 * When a Live session ends ("Sair" or expiry), signs out of Clerk too, so the next "Entrar"
 * starts clean. Offline the Clerk sign-out may fail; signing in clears what it left. Returns the
 * unsubscribe.
 */
export const endIdentityWithSession = (current: Identity = identity) =>
  useSession.subscribe((state, previous) => {
    if (previous.session?.live && !state.session) current.signOut().catch(() => {})
  })
