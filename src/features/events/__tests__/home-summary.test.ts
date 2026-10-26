import { sortEvents, type EventStatus } from '@/shared/domain/events'
import type { EventRole } from '@/shared/domain/roles'
import { createMockBackend } from '@/shared/mock-backend'

import { homeSummary, pendingByEvent, pendingTotal } from '../home-summary'
import { createMockEventsRepository } from '../mock'

const event = (
  status: EventStatus,
  role: EventRole | null,
  summary = { rsvpCount: 4, verifiedAmount: 350.5, registryItemCount: 3 },
) => ({ status, membership: role ? { role, isPrimaryOwner: false } : null, summary })

describe('homeSummary', () => {
  it.each<[EventRole | null, EventStatus, ReturnType<typeof homeSummary>]>([
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
    expect(homeSummary([event(status, role)])).toEqual(expected)
  })

  it('adds up the active Events and keeps centavos exact', () => {
    const events = [
      event('ACTIVE', 'OWNER', { rsvpCount: 5, verifiedAmount: 0.1, registryItemCount: 5 }),
      event('ACTIVE', 'VIEWER', { rsvpCount: 3, verifiedAmount: 0.2, registryItemCount: 2 }),
      event('ARCHIVED', 'OWNER', { rsvpCount: 2, verifiedAmount: 150, registryItemCount: 1 }),
      event('ARCHIVED', 'MANAGER'),
    ]

    expect(homeSummary(events)).toEqual({
      active: 2,
      archived: 2,
      rsvps: 8,
      verified: 0.3,
      registryItems: 7,
    })
  })

  it('is all zeros with no Event', () => {
    expect(homeSummary([])).toEqual({
      active: 0,
      archived: 0,
      rsvps: 0,
      verified: 0,
      registryItems: 0,
    })
  })

  describe('over the sample data', () => {
    const forUser = async (userId: number) => {
      const backend = createMockBackend()
      const repository = createMockEventsRepository({
        getRequester: () => backend.user(userId),
        backend,
      })
      return homeSummary(await repository.list())
    }

    it('the Super admin sees every Event', async () => {
      await expect(forUser(1)).resolves.toEqual({
        active: 5,
        archived: 1,
        rsvps: 16,
        verified: 1960,
        registryItems: 12,
      })
    })

    it('Cláudia Lima sees the Events she is a member of', async () => {
      await expect(forUser(7)).resolves.toEqual({
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
      })
    })
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
