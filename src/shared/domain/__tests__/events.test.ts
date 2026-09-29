import { eventPlace, formatEventDate, pendingTotal, sortEvents, type EventStatus } from '../events'

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

describe('eventPlace', () => {
  it('shows the type and the city', () => {
    expect(eventPlace({ type: 'WEDDING', city: 'Itu, SP' })).toBe('Casamento · Itu, SP')
    expect(eventPlace({ type: 'BABY_SHOWER', city: 'Campinas, SP' })).toBe(
      'Chá de bebê · Campinas, SP',
    )
  })

  it('shows just the type when the Event has no city', () => {
    expect(eventPlace({ type: 'CORPORATE', city: null })).toBe('Corporativo')
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
