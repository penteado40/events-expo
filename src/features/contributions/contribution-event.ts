import type { GuestDataScope } from '@/shared/domain/events'

/** What the Contributions' screens need of their Event: the money, and who sees the Guests. */
export type ContributionEvent = { id: number; currency: string } & GuestDataScope
