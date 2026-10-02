import {
  applyStatusChange,
  canVerify,
  sortContributions,
  undoStatusChange,
  verificationOutcomes,
  verifiedAmount,
  type ContributionStatus,
  type StatusChange,
} from '../contributions'
import type { EventStatus } from '../events'
import type { EventRole } from '../roles'

const c = (amount: number, status: ContributionStatus) => ({ amount, status })

describe('verifiedAmount', () => {
  it('sums only the VERIFIED Contributions', () => {
    expect(
      verifiedAmount([
        c(450, 'PAID'),
        c(200, 'VERIFIED'),
        c(890, 'VERIFIED'),
        c(450, 'REJECTED'),
        c(100, 'PENDING'),
        c(75, 'ABANDONED'),
      ]),
    ).toBe(1090)
  })

  it('keeps centavos exact', () => {
    expect(verifiedAmount([c(0.1, 'VERIFIED'), c(0.2, 'VERIFIED')])).toBe(0.3)
  })

  it('is zero with nothing verified', () => {
    expect(verifiedAmount([])).toBe(0)
    expect(verifiedAmount([c(180, 'PAID')])).toBe(0)
  })
})

describe('canVerify', () => {
  const as = (role: EventRole | null, status: EventStatus) => ({
    status,
    membership: role ? { role, isPrimaryOwner: false } : null,
  })

  it.each<[EventRole | null, EventStatus, boolean]>([
    ['OWNER', 'ACTIVE', true],
    ['MANAGER', 'ACTIVE', true],
    ['VIEWER', 'ACTIVE', false],
    // No Membership: the Super admin, who is never an Event member.
    [null, 'ACTIVE', true],
    // Archived: Owners still verify (events-api ADR-0011's refinement), Managers don't.
    ['OWNER', 'ARCHIVED', true],
    ['MANAGER', 'ARCHIVED', false],
    ['VIEWER', 'ARCHIVED', false],
    [null, 'ARCHIVED', true],
  ])('%s on an %s Event → %s', (role, status, expected) => {
    expect(canVerify(as(role, status))).toBe(expected)
  })
})

describe('sortContributions', () => {
  const paid = (id: number, status: ContributionStatus, paidAt: string) => ({ id, status, paidAt })

  it('puts PAID first, oldest first; then VERIFIED and REJECTED together, most recent first', () => {
    const sorted = sortContributions([
      paid(1, 'VERIFIED', '2026-09-21T11:30:00.000Z'),
      paid(2, 'PAID', '2026-09-27T00:14:00.000Z'),
      paid(3, 'REJECTED', '2026-09-23T15:00:00.000Z'),
      paid(4, 'PAID', '2026-09-25T22:40:00.000Z'),
      paid(5, 'VERIFIED', '2026-09-19T18:12:00.000Z'),
      paid(6, 'PAID', '2026-09-26T13:02:00.000Z'),
    ])

    expect(sorted.map((c) => c.id)).toEqual([4, 6, 2, 3, 1, 5])
  })

  it('leaves the list it was given untouched', () => {
    const list = [
      paid(1, 'VERIFIED', '2026-09-21T11:30:00.000Z'),
      paid(2, 'PAID', '2026-09-27T00:14:00.000Z'),
    ]

    sortContributions(list)

    expect(list.map((c) => c.id)).toEqual([1, 2])
  })
})

describe('verificationOutcomes', () => {
  it.each<[ContributionStatus, string[]]>([
    ['PAID', ['REJECTED', 'VERIFIED']],
    // A decided one can be revised to the other, never back to PAID.
    ['VERIFIED', ['REJECTED']],
    ['REJECTED', ['VERIFIED']],
    // Not marked paid: nothing to verify.
    ['PENDING', []],
    ['ABANDONED', []],
  ])('%s → %j', (status, outcomes) => {
    expect(verificationOutcomes(status)).toEqual(outcomes)
  })
})

describe('applyStatusChange', () => {
  // Ana & Rafael (12) and Chá da Júlia (15), as the Events list and Conferir cache them.
  const state = () => ({
    events: [
      { id: 12, paidContributionCount: 3, summary: { verifiedAmount: 200 } },
      { id: 15, paidContributionCount: 2, summary: { verifiedAmount: 1500 } },
    ],
    event: { id: 12, paidContributionCount: 3, summary: { verifiedAmount: 200 } },
    contributions: [
      { id: 301, amount: 450, status: 'PAID' as ContributionStatus },
      { id: 298, amount: 200, status: 'VERIFIED' as ContributionStatus },
      { id: 290, amount: 450, status: 'REJECTED' as ContributionStatus },
    ],
  })
  // Everything on screen a Verification moves: the Início numbers (from the Events list) and the
  // Event detail's (badge, Conferir's "Verificado").
  const screen = (s: ReturnType<typeof state>) => ({
    pending: s.events.reduce((total, e) => total + e.paidContributionCount, 0),
    homeVerified: s.events.reduce((total, e) => total + e.summary.verifiedAmount, 0),
    badge: s.event.paidContributionCount,
    eventVerified: s.event.summary.verifiedAmount,
    verified: verifiedAmount(s.contributions),
  })
  const apply = (change: StatusChange, before = state()) => {
    const after = applyStatusChange(before, 12, change)
    return after as ReturnType<typeof state>
  }
  const verify301: StatusChange = { contributionId: 301, amount: 450, from: 'PAID', to: 'VERIFIED' }

  it('verifying a PAID one: one less to verify, its amount into every "Verificado"', () => {
    const after = apply(verify301)

    expect(screen(state())).toEqual({
      pending: 5,
      homeVerified: 1700,
      badge: 3,
      eventVerified: 200,
      verified: 200,
    })
    expect(screen(after)).toEqual({
      pending: 4,
      homeVerified: 2150,
      badge: 2,
      eventVerified: 650,
      verified: 650,
    })
    expect(after.contributions[0].status).toBe('VERIFIED')
  })

  it('rejecting a PAID one: one less to verify, "Verificado" unchanged', () => {
    const after = apply({ contributionId: 301, amount: 450, from: 'PAID', to: 'REJECTED' })

    expect(screen(after)).toEqual({
      pending: 4,
      homeVerified: 1700,
      badge: 2,
      eventVerified: 200,
      verified: 200,
    })
  })

  it('revising leaves the counts and moves only "Verificado"', () => {
    expect(
      screen(apply({ contributionId: 290, amount: 450, from: 'REJECTED', to: 'VERIFIED' })),
    ).toEqual({ pending: 5, homeVerified: 2150, badge: 3, eventVerified: 650, verified: 650 })
    expect(
      screen(apply({ contributionId: 298, amount: 200, from: 'VERIFIED', to: 'REJECTED' })),
    ).toEqual({ pending: 5, homeVerified: 1500, badge: 3, eventVerified: 0, verified: 0 })
  })

  it('keeps centavos exact in the Event summary', () => {
    const before = state()
    before.events[0].summary.verifiedAmount = 0.1
    const after = applyStatusChange({ ...before, contributions: undefined }, 12, {
      contributionId: 301,
      amount: 0.2,
      from: 'PAID',
      to: 'VERIFIED',
    })

    expect(after.events?.[0].summary.verifiedAmount).toBe(0.3)
  })

  it('never takes the Event summary below zero', () => {
    const after = apply({ contributionId: 298, amount: 900, from: 'VERIFIED', to: 'REJECTED' })

    expect(after.event.summary.verifiedAmount).toBe(0)
  })

  it('touches only the Event it belongs to', () => {
    const after = apply(verify301)

    expect(after.events[1]).toEqual(state().events[1])
  })

  it('rolls back to exactly where it started', () => {
    const changes: StatusChange[] = [
      { contributionId: 301, amount: 450, from: 'PAID', to: 'REJECTED' },
      verify301,
    ]

    changes.forEach((change) =>
      expect(apply(undoStatusChange(change), apply(change))).toEqual(state()),
    )
  })

  it("doesn't undo a later change: a rollback applies only while the Contribution is as left", () => {
    const verified = apply(verify301)
    // A refetch brought it back as REJECTED (someone else revised it) before the failure arrived.
    verified.contributions[0] = { ...verified.contributions[0], status: 'REJECTED' }

    const rolledBack = apply(undoStatusChange(verify301), verified)

    expect(rolledBack).toBe(verified)
  })

  it('updates the Events even when the Contributions are not cached (from Início)', () => {
    const after = applyStatusChange({ ...state(), contributions: undefined }, 12, verify301)

    expect(after.events?.[0]).toEqual({
      id: 12,
      paidContributionCount: 2,
      summary: { verifiedAmount: 650 },
    })
    expect(after.event?.paidContributionCount).toBe(2)
  })

  it('leaves what is not cached uncached', () => {
    const after = applyStatusChange(
      { events: undefined, event: undefined, contributions: undefined },
      12,
      verify301,
    )

    expect(after).toEqual({ events: undefined, event: undefined, contributions: undefined })
  })
})
