import { createLastEmailStore } from './last-email-store'
import { createSessionStore } from './session-store'

export type { Session } from './session-store'
export type { User } from './user'
export { userSchema } from './user'

/** The device's Session (CONTEXT.md). */
export const useSession = createSessionStore()

/** The email last used with "Entrar". */
export const useLastEmail = createLastEmailStore()
