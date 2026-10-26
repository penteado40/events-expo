import { sortEvents, type EventStatus } from '@/shared/domain/events'
import type { EventRole } from '@/shared/domain/roles'
import { createMockBackend } from '@/shared/mock-backend'
import { SAMPLE_DATE } from '@/shared/mock-backend/data'

import {
  distanceLabel,
  homeSummary,
  pendingByEvent,
  pendingTotal,
  type HomeNumbers,
} from '../home-summary'
import { createMockEventsRepository } from '../mock'

/** 01/10/2026, 12:00 in São Paulo (UTC-3). */
const NOW = new Date('2026-10-01T15:00:00.000Z')
const SAO_PAULO = 'America/Sao_Paulo'

/** An Event that ended before NOW: only its numbers count. */
const event = (
  status: EventStatus,
  role: EventRole | null,
  summary = { rsvpCount: 4, verifiedAmount: 350.5, registryItemCount: 3 },
) => ({
  status,
  membership: role ? { role, isPrimaryOwner: false } : null,
  summary,
  startsAt: '2026-09-01T12:00:00.000Z',
  endsAt: null as string | null,
  timezone: SAO_PAULO,
})

describe('homeSummary', () => {
  it.each<[EventRole | null, EventStatus, HomeNumbers]>([
    [null, 'ACTIVE', { active: 1, archived: 0, rsvps: 4, verified: 350.5, registryItems: 3 }],
    ['OWNER', 'ACTIVE', { active: 1, archived: 0, rsvps: 4, verified: 350.5, registryItems: 3 }],
    ['MANAGER', 'ACTIVE', { active: 1, archived: 0, rsvps: 4, verified: 350.5, registryItems: 3 }],
    ['VIEWER', 'ACTIVE', { active: 1, archived: 0, rsvps: 4, verified: 350.5, registryItems: 3 }],
    // An archived Event is counted as archived and adds nothing else, whoever the viewer is.
    [null, 'ARCHIVED', { active: 0, archived: 1, rsvps: 0, verified: 0, registryItems: 0 }],
    ['OWNER', 'ARCHIVED', { active: 0, archived: 1, rsvps: 0, verified: 0, registryItems: 0 }],
    ['MANAGER', 'ARCHIVED', { active: 0, archived: 1, rsvps: 0, verified: 0, registryItems: 0 }],
    ['VIEWER', 'ARCHIVED', { active: 0, archived: 1, rsvps: 0, verified: 0, registryItems: 0 }],
  ])('%s on an %s Event → %o', (role, status, expected) => {
    expect(homeSummary([event(status, role)], NOW)).toMatchObject(expected)
  })

  it('adds up the active Events and keeps centavos exact', () => {
    const events = [
      event('ACTIVE', 'OWNER', { rsvpCount: 5, verifiedAmount: 0.1, registryItemCount: 5 }),
      event('ACTIVE', 'VIEWER', { rsvpCount: 3, verifiedAmount: 0.2, registryItemCount: 2 }),
      event('ARCHIVED', 'OWNER', { rsvpCount: 2, verifiedAmount: 150, registryItemCount: 1 }),
      event('ARCHIVED', 'MANAGER'),
    ]

    expect(homeSummary(events, NOW)).toMatchObject({
      active: 2,
      archived: 2,
      rsvps: 8,
      verified: 0.3,
      registryItems: 7,
    })
  })

  it('is all zeros, with nothing happening or upcoming, with no Event', () => {
    expect(homeSummary([], NOW)).toEqual({
      active: 0,
      archived: 0,
      rsvps: 0,
      verified: 0,
      registryItems: 0,
      happening: [],
      next: null,
      upcoming: [],
    })
  })

  describe('over the sample data', () => {
    const forUser = async (userId: number) => {
      const backend = createMockBackend()
      const repository = createMockEventsRepository({
        getRequester: () => backend.user(userId),
        backend,
      })
      return homeSummary(await repository.list(), SAMPLE_DATE)
    }

    it('the Super admin sees every Event', async () => {
      await expect(forUser(1)).resolves.toMatchObject({
        active: 5,
        archived: 1,
        rsvps: 16,
        verified: 1960,
        registryItems: 12,
      })
    })

    it('Cláudia Lima sees the Events she is a member of', async () => {
      await expect(forUser(7)).resolves.toMatchObject({
        active: 4,
        archived: 1,
        rsvps: 15,
        verified: 1960,
        registryItems: 12,
      })
    })

    it('Otávio Kern, Manager of an archived Event only, sees zeros and one archived', async () => {
      await expect(forUser(8)).resolves.toEqual({
        active: 0,
        archived: 1,
        rsvps: 0,
        verified: 0,
        registryItems: 0,
        happening: [],
        next: null,
        upcoming: [],
      })
    })

    it("Cláudia's birthday is happening; Chá da Júlia is next, with Marcos, 40 within 30 days", async () => {
      const summary = await forUser(7)

      expect(summary.happening.map((e) => e.name)).toEqual(['Aniversário da Cláudia'])
      expect(summary.next).toMatchObject({ event: { name: 'Chá da Júlia' }, days: 10 })
      expect(summary.upcoming.map(({ event, days }) => [event.name, days])).toEqual([
        ['Chá da Júlia', 10],
        ['Marcos, 40', 23],
      ])
    })
  })
})

const dated = (
  id: number,
  startsAt: string,
  { endsAt = null, timezone = SAO_PAULO, status = 'ACTIVE' as EventStatus } = {} as {
    endsAt?: string | null
    timezone?: string
    status?: EventStatus
  },
) => ({
  id,
  status,
  membership: null,
  summary: { rsvpCount: 0, verifiedAmount: 0, registryItemCount: 0 },
  startsAt,
  endsAt,
  timezone,
})

describe('homeSummary: happening', () => {
  const happening = (e: ReturnType<typeof dated>, now = NOW) =>
    homeSummary([e], now).happening.length === 1

  it.each<[string, string, { endsAt?: string | null; timezone?: string }, boolean]>([
    ['started earlier today, no end', '2026-10-01T12:00:00.000Z', {}, true],
    ['starts right now', '2026-10-01T15:00:00.000Z', {}, true],
    ['starts later today', '2026-10-01T22:00:00.000Z', {}, false],
    ['started yesterday, no end: over at midnight', '2026-10-01T02:00:00.000Z', {}, false],
    [
      'started yesterday, ends tomorrow',
      '2026-09-30T20:00:00.000Z',
      { endsAt: '2026-10-02T03:00:00.000Z' },
      true,
    ],
    [
      'started today, ended an hour ago',
      '2026-10-01T10:00:00.000Z',
      { endsAt: '2026-10-01T14:00:00.000Z' },
      false,
    ],
    ['ends exactly now', '2026-10-01T10:00:00.000Z', { endsAt: '2026-10-01T15:00:00.000Z' }, false],
    // 00:00 of 02/10 in Tokyo: its 01/10 Event is over, though São Paulo is still on 01/10.
    [
      'started on its 01/10 in Tokyo, no end',
      '2026-10-01T05:00:00.000Z',
      { timezone: 'Asia/Tokyo' },
      false,
    ],
  ])('%s → %p', (_, startsAt, options, expected) => {
    expect(happening(dated(1, startsAt, options))).toBe(expected)
  })

  it("lasts until the end of its day in the Event's timezone, not UTC's", () => {
    // 23:30 of 01/10 in São Paulo, already 02/10 in UTC.
    const lateNight = new Date('2026-10-02T02:30:00.000Z')

    expect(happening(dated(1, '2026-10-01T13:00:00.000Z'), lateNight)).toBe(true)
  })

  it('never lists an archived Event', () => {
    expect(happening(dated(1, '2026-10-01T12:00:00.000Z', { status: 'ARCHIVED' }))).toBe(false)
  })

  it('lists every one, the earliest first', () => {
    const events = [dated(2, '2026-10-01T13:00:00.000Z'), dated(1, '2026-10-01T11:00:00.000Z')]

    expect(homeSummary(events, NOW).happening.map((e) => e.id)).toEqual([1, 2])
  })
})

describe('homeSummary: upcoming', () => {
  const next = (...events: ReturnType<typeof dated>[]) => homeSummary(events, NOW).next

  it.each<[string, string, string, number]>([
    ['later today', '2026-10-01T22:00:00.000Z', SAO_PAULO, 0],
    ['23:00 today, already tomorrow in UTC', '2026-10-02T02:00:00.000Z', SAO_PAULO, 0],
    ['at midnight', '2026-10-02T03:00:00.000Z', SAO_PAULO, 1],
    ['tomorrow 09:00, under 24 h away', '2026-10-02T12:00:00.000Z', SAO_PAULO, 1],
    ['in 10 days', '2026-10-11T18:00:00.000Z', SAO_PAULO, 10],
    // NOW is already 02/10 in Tokyo: 23:00 of 02/10 there is today.
    ['today in Tokyo, tomorrow in São Paulo', '2026-10-02T14:00:00.000Z', 'Asia/Tokyo', 0],
  ])("%s → %i days, in the Event's calendar", (_, startsAt, timezone, days) => {
    expect(next(dated(1, startsAt, { timezone }))).toEqual({
      event: expect.objectContaining({ id: 1 }),
      days,
    })
  })

  it('is the nearest active one, and the 30-day list nearest first', () => {
    const summary = homeSummary(
      [
        dated(3, '2026-10-20T12:00:00.000Z'),
        dated(9, '2026-10-02T12:00:00.000Z', { status: 'ARCHIVED' }),
        dated(1, '2026-10-05T12:00:00.000Z'),
        dated(2, '2026-10-01T12:00:00.000Z'),
      ],
      NOW,
    )

    expect(summary.next?.event.id).toBe(1)
    expect(summary.upcoming.map(({ event, days }) => [event.id, days])).toEqual([
      [1, 4],
      [3, 19],
    ])
  })

  it('counts an Event 30 days away in the 30-day list, not one 31 days away', () => {
    const summary = homeSummary(
      [dated(1, '2026-10-31T23:00:00.000Z'), dated(2, '2026-11-01T12:00:00.000Z')],
      NOW,
    )

    expect(summary.upcoming.map(({ event, days }) => [event.id, days])).toEqual([[1, 30]])
  })

  it('is the nearest one however far, with an empty 30-day list', () => {
    const summary = homeSummary([dated(1, '2026-11-15T12:00:00.000Z')], NOW)

    expect(summary.next).toMatchObject({ event: { id: 1 }, days: 45 })
    expect(summary.upcoming).toEqual([])
  })

  it('is null when nothing is upcoming', () => {
    expect(
      next(dated(1, '2026-10-01T12:00:00.000Z'), dated(2, '2026-09-20T12:00:00.000Z')),
    ).toBeNull()
  })
})

describe('distanceLabel', () => {
  it.each([
    [0, 'hoje'],
    [1, 'amanhã'],
    [2, 'em 2 dias'],
    [45, 'em 45 dias'],
  ])('%i → %s', (days, label) => {
    expect(distanceLabel(days)).toBe(label)
  })
})

const pendingEvent = (id: number, status: EventStatus, role: EventRole | null, paid: number) => ({
  id,
  name: `Event ${id}`,
  status,
  membership: role ? { role, isPrimaryOwner: false } : null,
  paidContributionCount: paid,
})

const ROLES: (EventRole | null)[] = [null, 'OWNER', 'MANAGER', 'VIEWER']

describe('pendingTotal', () => {
  it.each<[EventRole | null, EventStatus, number | null]>([
    [null, 'ACTIVE', 3],
    ['OWNER', 'ACTIVE', 3],
    ['MANAGER', 'ACTIVE', 3],
    ['VIEWER', 'ACTIVE', null],
    [null, 'ARCHIVED', 3],
    ['OWNER', 'ARCHIVED', 3],
    ['MANAGER', 'ARCHIVED', null],
    ['VIEWER', 'ARCHIVED', null],
  ])('%s on an %s Event with 3 PAID → %p', (role, status, expected) => {
    expect(pendingTotal([pendingEvent(1, status, role, 3)])).toBe(expected)
  })

  it('counts only the Events where the viewer does the Verification', () => {
    const events = [
      pendingEvent(1, 'ACTIVE', 'OWNER', 2),
      pendingEvent(2, 'ACTIVE', 'VIEWER', 5),
      pendingEvent(3, 'ARCHIVED', 'MANAGER', 4),
      pendingEvent(4, 'ACTIVE', 'MANAGER', 1),
    ]

    expect(pendingTotal(events)).toBe(3)
  })

  it.each(ROLES.filter((role) => role !== 'VIEWER'))(
    'is 0, not hidden, for %s with nothing to verify',
    (role) => {
      expect(pendingTotal([pendingEvent(1, 'ACTIVE', role, 0)])).toBe(0)
    },
  )

  it('is hidden (null) with no Event', () => {
    expect(pendingTotal([])).toBeNull()
  })
})

describe('pendingByEvent', () => {
  it.each<[EventRole | null, EventStatus, boolean]>([
    [null, 'ACTIVE', true],
    ['OWNER', 'ACTIVE', true],
    ['MANAGER', 'ACTIVE', true],
    ['VIEWER', 'ACTIVE', false],
    [null, 'ARCHIVED', true],
    ['OWNER', 'ARCHIVED', true],
    ['MANAGER', 'ARCHIVED', false],
    ['VIEWER', 'ARCHIVED', false],
  ])('%s on an %s Event with PAID → listed: %p', (role, status, listed) => {
    expect(pendingByEvent([pendingEvent(1, status, role, 2)])).toEqual(
      listed ? [{ id: 1, name: 'Event 1', count: 2 }] : [],
    )
  })

  it('leaves out Events with nothing to verify and keeps the list order', () => {
    const events = [
      pendingEvent(3, 'ACTIVE', 'OWNER', 1),
      pendingEvent(1, 'ACTIVE', 'OWNER', 0),
      pendingEvent(2, 'ACTIVE', 'MANAGER', 4),
    ]

    expect(pendingByEvent(events)).toEqual([
      { id: 3, name: 'Event 3', count: 1 },
      { id: 2, name: 'Event 2', count: 4 },
    ])
  })
})

describe('pending work over the sample data', () => {
  const forUser = async (userId: number) => {
    const backend = createMockBackend()
    const repository = createMockEventsRepository({
      getRequester: () => backend.user(userId),
      backend,
    })
    const events = sortEvents(await repository.list())
    return { total: pendingTotal(events), byEvent: pendingByEvent(events) }
  }

  it('the Super admin verifies every Event', async () => {
    await expect(forUser(1)).resolves.toEqual({
      total: 8,
      byEvent: [
        { id: 17, name: 'Aniversário da Cláudia', count: 2 },
        { id: 15, name: 'Chá da Júlia', count: 2 },
        { id: 14, name: 'Marcos, 40', count: 1 },
        { id: 12, name: 'Ana & Rafael', count: 3 },
      ],
    })
  })

  it('Cláudia Lima, Viewer of Chá da Júlia, does not count it', async () => {
    await expect(forUser(7)).resolves.toEqual({
      total: 6,
      byEvent: [
        { id: 17, name: 'Aniversário da Cláudia', count: 2 },
        { id: 14, name: 'Marcos, 40', count: 1 },
        { id: 12, name: 'Ana & Rafael', count: 3 },
      ],
    })
  })

  it('Otávio Kern, Manager of an archived Event only, has no pending work', async () => {
    await expect(forUser(8)).resolves.toEqual({ total: null, byEvent: [] })
  })
})
