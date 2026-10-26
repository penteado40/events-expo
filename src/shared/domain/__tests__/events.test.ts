import type { Membership } from '../roles'
import {
  calendarDay,
  formatEventDayMonth,
  canSeeGuests,
  formatEventDate,
  formatEventDay,
  formatEventDayTime,
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

describe('formatEventDayMonth', () => {
  it.each([
    ['2026-10-11T18:00:00.000Z', 'America/Sao_Paulo', { day: '11', month: 'OUT' }],
    ['2026-03-05T12:00:00.000Z', 'America/Sao_Paulo', { day: '5', month: 'MAR' }],
    // 23:30 of 31/10 in São Paulo is already 01/11 in UTC: the Event's day wins.
    ['2026-11-01T02:30:00.000Z', 'America/Sao_Paulo', { day: '31', month: 'OUT' }],
    ['2026-11-01T02:30:00.000Z', 'Europe/Lisbon', { day: '1', month: 'NOV' }],
  ])('%s in %s → %o', (iso, timezone, expected) => {
    expect(formatEventDayMonth(iso, timezone)).toEqual(expected)
  })
})

describe('calendarDay', () => {
  it('counts whole days between two dates on the calendar of a timezone', () => {
    const day = (iso: string, timezone = 'America/Sao_Paulo') =>
      calendarDay(new Date(iso), timezone)

    // 23:59 and 00:00 a minute later are a day apart; 00:00 and 23:59 are the same day.
    expect(day('2026-10-02T03:00:00.000Z') - day('2026-10-02T02:59:00.000Z')).toBe(1)
    expect(day('2026-10-03T02:59:00.000Z') - day('2026-10-02T03:00:00.000Z')).toBe(0)
    expect(day('2026-10-11T18:00:00.000Z') - day('2026-10-01T15:00:00.000Z')).toBe(10)
    // The same moment is 01/10 in São Paulo and 02/10 in Tokyo.
    expect(day('2026-10-01T15:00:00.000Z', 'Asia/Tokyo') - day('2026-10-01T15:00:00.000Z')).toBe(1)
  })
})
