import { createSessionStore } from './session-store'

export type { Session } from './session-store'
export type { User } from './user'
export { userSchema } from './user'

/** The device's Session (CONTEXT.md). */
export const useSession = createSessionStore()

/** Ends the Session the API refused (`UNAUTHENTICATED`); its screens then return to the login. */
export const expireSession = (token: string | null) => useSession.getState().expire(token)
