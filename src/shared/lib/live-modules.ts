/**
 * Modules whose repositories talk to the real events-api in a Live session.
 * Every other module uses its mock (development builds only).
 */
export const LIVE_MODULES: readonly LiveModule[] = ['auth']

/** Grows as each module gets an HTTP implementation. */
export type LiveModule = 'auth'
