import { isArchived, type GuestDataScope } from './events'

export const CONTRIBUTION_STATUSES = [
  'PENDING',
  'ABANDONED',
  'PAID',
  'VERIFIED',
  'REJECTED',
] as const

export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number]

/** The "Verificado" stat: the amount of the VERIFIED Contributions, summed in centavos. */
export function verifiedAmount(
  contributions: readonly { amount: number; status: ContributionStatus }[],
) {
  const centavos = contributions
    .filter((c) => c.status === 'VERIFIED')
    .reduce((total, c) => total + Math.round(c.amount * 100), 0)
  return centavos / 100
}

/**
 * Whether the viewer does the Verification of the Event's PAID Contributions. The Super admin (no
 * Membership) and Owners always do, archived Events included (events-api ADR-0011's refinement);
 * Managers only while the Event is active; Viewers never.
 */
export function canVerify({ status, membership }: GuestDataScope): boolean {
  if (membership === null || membership.role === 'OWNER') return true
  return membership.role === 'MANAGER' && !isArchived({ status })
}

type Sortable = { status: ContributionStatus; paidAt: string }

/**
 * Conferir's order: the PAID ones first, as a queue (who marked paid longest ago waits longest);
 * then the verified and rejected ones together, as history (most recent first).
 */
export function sortContributions<C extends Sortable>(contributions: readonly C[]): C[] {
  const time = (contribution: C) => Date.parse(contribution.paidAt)
  const isPaid = (contribution: C) => contribution.status === 'PAID'
  return [...contributions].sort((a, b) => {
    if (isPaid(a) !== isPaid(b)) return isPaid(a) ? -1 : 1
    return isPaid(a) ? time(a) - time(b) : time(b) - time(a)
  })
}
