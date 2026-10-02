import {
  canVerify,
  sortContributions,
  verifiedAmount,
  type ContributionStatus,
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
