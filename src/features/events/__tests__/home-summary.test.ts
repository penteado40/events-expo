import type { EventStatus } from '@/shared/domain/events'
import type { EventRole } from '@/shared/domain/roles'
import { createMockBackend } from '@/shared/mock-backend'

import { homeSummary } from '../home-summary'
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
