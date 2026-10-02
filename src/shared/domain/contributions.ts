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

/** What a Verification decides a Contribution marked paid is. */
export type VerificationOutcome = Extract<ContributionStatus, 'VERIFIED' | 'REJECTED'>

/**
 * The outcomes a verifier can pick for a Contribution in this status. A PAID one gets either; a
 * decided one can be revised to the other (events-api ADR-0004's refinement: a Pix rejected that
 * shows up later, or one verified by mistake). Never back to PAID.
 */
export function verificationOutcomes(status: ContributionStatus): VerificationOutcome[] {
  switch (status) {
    case 'PAID':
      return ['REJECTED', 'VERIFIED']
    case 'VERIFIED':
      return ['REJECTED']
    case 'REJECTED':
      return ['VERIFIED']
    default:
      return []
  }
}

/** One Contribution's status change: the optimistic Verification, or its rollback. */
export type StatusChange = {
  contributionId: number
  from: ContributionStatus
  to: ContributionStatus
}

/** The change that undoes this one (the rollback of a failed Verification). */
export const undoStatusChange = ({ contributionId, from, to }: StatusChange): StatusChange => ({
  contributionId,
  from: to,
  to: from,
})

/** An Event as far as a Verification changes it: its count of PAID Contributions. */
export type CountedEvent = { id: number; paidContributionCount: number }

/**
 * What a Verification changes on screen before the API answers: the Event's list (hero total,
 * card chip), the Event itself ("Conferir" dot, "Para conferir") and its Contributions (Conferir,
 * "Verificado"). Each is undefined when not cached, and stays so.
 */
export type VerificationCaches<
  E extends CountedEvent,
  C extends { id: number; status: ContributionStatus },
> = {
  events: readonly E[] | undefined
  event: E | undefined
  contributions: readonly C[] | undefined
}

/**
 * The optimistic Verification (and, with `undoStatusChange`, its rollback). The Contribution
 * changes only if it is still in `from`, so a rollback never undoes a later change; the PAID count
 * follows the change: leaving PAID is one less, coming back (a rollback) one more.
 */
export function applyStatusChange<
  E extends CountedEvent,
  C extends { id: number; status: ContributionStatus },
>(
  state: VerificationCaches<E, C>,
  eventId: number,
  change: StatusChange,
): VerificationCaches<E, C> {
  const delta = (change.to === 'PAID' ? 1 : 0) - (change.from === 'PAID' ? 1 : 0)
  const count = (event: E): E =>
    event.id === eventId && delta !== 0
      ? { ...event, paidContributionCount: Math.max(0, event.paidContributionCount + delta) }
      : event
  const contribution = (c: C): C =>
    c.id === change.contributionId && c.status === change.from ? { ...c, status: change.to } : c
  const applies =
    state.contributions === undefined ||
    state.contributions.some((c) => c.id === change.contributionId && c.status === change.from)

  if (!applies) return state
  return {
    events: state.events?.map(count),
    event: state.event && count(state.event),
    contributions: state.contributions?.map(contribution),
  }
}
