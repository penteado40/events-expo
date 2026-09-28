/**
 * Modules whose repositories talk to the real events-api in a Live session.
 * Every other module uses its mock (development builds only). `auth` joins in PROJ-86.
 */
export const LIVE_MODULES: readonly LiveModule[] = []

export type LiveModule = 'auth' | 'events' | 'members' | 'rsvps' | 'registry' | 'contributions'
