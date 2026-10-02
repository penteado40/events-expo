import type { Membership } from '../roles'
import {
  canSeeGuests,
  formatEventDate,
  formatEventDay,
  formatEventDayTime,
  pendingTotal,
  sortEvents,
  type EventStatus,
} from '../events'

describe('formatEventDate', () => {
  it.each([
    ['2026-11-14T19:30:00.000Z', 'America/Sao_Paulo', '14.11.26 · 16:30'],
    // The time on the invitation, whatever the device's timezone.
    ['2026-11-14T19:30:00.000Z', 'Europe/Lisbon', '14.11.26 · 19:30'],
    // Crosses midnight: the Event's day, not UTC's.
    ['2026-10-25T01:00:00.000Z', 'America/Sao_Paulo', '24.10.26 · 22:00'],
    ['2026-01-01T03:00:00.000Z', 'America/Sao_Paulo', '01.01.26 · 00:00'],
  ])('%s in %s → %s', (startsAt, timezone, expected) => {
    expect(formatEventDate(startsAt, timezone)).toBe(expected)
  })
})

describe('sortEvents', () => {
  const event = (id: number, status: EventStatus, startsAt: string) => ({ id, status, startsAt })

  it('lists active Events soonest first, then archived Events most recent first', () => {
    const events = [
      event(1, 'ARCHIVED', '2026-01-10T12:00:00.000Z'),
      event(2, 'ACTIVE', '2026-12-12T22:00:00.000Z'),
      event(3, 'ARCHIVED', '2026-09-12T12:00:00.000Z'),
      event(4, 'ACTIVE', '2026-10-11T18:00:00.000Z'),
      event(5, 'ACTIVE', '2026-10-24T23:00:00.000Z'),
    ]

    expect(sortEvents(events).map((e) => e.id)).toEqual([4, 5, 2, 3, 1])
  })

  it('does not change the list it was given', () => {
    const events = [
      event(1, 'ACTIVE', '2026-12-12T22:00:00.000Z'),
      event(2, 'ACTIVE', '2026-10-11T18:00:00.000Z'),
    ]

    sortEvents(events)

    expect(events.map((e) => e.id)).toEqual([1, 2])
  })
})

describe('pendingTotal', () => {
  it('adds up the PAID Contributions of every visible Event', () => {
    const events = [
      { paidContributionCount: 3 },
      { paidContributionCount: 0 },
      { paidContributionCount: 2 },
    ]

    expect(pendingTotal(events)).toBe(5)
  })

  it('is zero without Events', () => {
    expect(pendingTotal([])).toBe(0)
  })
})

describe('canSeeGuests', () => {
  const OWNER: Membership = { role: 'OWNER', isPrimaryOwner: false }
  const MANAGER: Membership = { role: 'MANAGER', isPrimaryOwner: false }
  const VIEWER: Membership = { role: 'VIEWER', isPrimaryOwner: false }
  const SUPER_ADMIN = null

  // events-api ADR-0011: after archiving, Guest data stays only with Owners and the Super admin.
  it.each([
    ['ACTIVE', OWNER, true],
    ['ACTIVE', MANAGER, true],
    ['ACTIVE', VIEWER, true],
    ['ACTIVE', SUPER_ADMIN, true],
    ['ARCHIVED', OWNER, true],
    ['ARCHIVED', MANAGER, false],
    ['ARCHIVED', VIEWER, false],
    ['ARCHIVED', SUPER_ADMIN, true],
  ] as const)('%s Event, membership %j → %s', (status, membership, expected) => {
    expect(canSeeGuests({ status, membership })).toBe(expected)
  })
})

describe('formatEventDay', () => {
  it.each([
    ['2026-09-25T15:00:00.000Z', 'America/Sao_Paulo', '25/09'],
    // 23:30 in São Paulo is already the next day in UTC and in Lisbon: the Event's day wins.
    ['2026-09-26T02:30:00.000Z', 'America/Sao_Paulo', '25/09'],
    ['2026-09-26T02:30:00.000Z', 'Europe/Lisbon', '26/09'],
  ])('%s in %s → %s', (iso, timezone, expected) => {
    expect(formatEventDay(iso, timezone)).toBe(expected)
  })
})

describe('formatEventDayTime', () => {
  it.each([
    ['2026-09-27T00:14:00.000Z', 'America/Sao_Paulo', '26/09 21:14'],
    ['2026-09-26T13:02:00.000Z', 'America/Sao_Paulo', '26/09 10:02'],
    ['2026-09-26T13:02:00.000Z', 'Europe/Lisbon', '26/09 14:02'],
  ])('%s in %s → %s', (iso, timezone, expected) => {
    expect(formatEventDayTime(iso, timezone)).toBe(expected)
  })
})
