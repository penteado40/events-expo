/** Every module with a repository; each gets a mock first and an HTTP implementation later. */
export type DataModule = 'auth' | 'events'

/**
 * Modules whose repositories talk to the real events-api in a Live session.
 * Every other module uses its mock (development builds only).
 */
export const LIVE_MODULES: readonly DataModule[] = ['auth']
