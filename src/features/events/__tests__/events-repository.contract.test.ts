import { createHttpClient } from '@/shared/lib/http'
import { createMockBackend, mockTokenFor } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi } from '@/shared/mock-backend/fake-api'

import { createHttpEventsRepository, type EventsRepository } from '../api'
import { createMockEventsRepository } from '../mock'

/** A repository for the sample User with that id, or for no Session (`null`). */
type CreateRepository = (userId: number | null) => EventsRepository

const implementations: [string, CreateRepository][] = [
  [
    'mock',
    (userId) => {
      const backend = createMockBackend()
      const getRequester = () => (userId === null ? null : backend.user(userId))
      return createMockEventsRepository({ getRequester, backend })
    },
  ],
  [
    'HTTP',
    (userId) =>
      createHttpEventsRepository(
        createHttpClient({
          baseUrl: BASE_URL,
          getToken: () => (userId === null ? null : mockTokenFor({ id: userId })),
          fetch: createFakeApi(),
        }),
      ),
  ],
]

const SUPER_ADMIN = 1
const CLAUDIA = 7
const NO_EVENTS = 9
/** Manager of Offsite Kora (9), which is archived. */
const KORA_MANAGER = 8

describe.each(implementations)('EventsRepository contract (%s)', (_, createRepository) => {
  const as = (userId: number) => createRepository(userId)

  describe('list()', () => {
    it('gives the Super admin every Event, with no Membership in any', async () => {
      const events = await as(SUPER_ADMIN).list()

      expect(events.map((e) => e.id).sort((a, b) => a - b)).toEqual([9, 12, 14, 15, 16, 17])
      expect(events.every((e) => e.membership === null)).toBe(true)
    })

    it('gives a User only the Events they are a member of, with their Membership', async () => {
      const events = await as(CLAUDIA).list()

      expect(Object.fromEntries(events.map((e) => [e.id, e.membership]))).toEqual({
        12: { role: 'OWNER', isPrimaryOwner: false },
        15: { role: 'VIEWER', isPrimaryOwner: false },
        14: { role: 'MANAGER', isPrimaryOwner: false },
        9: { role: 'OWNER', isPrimaryOwner: true },
        17: { role: 'OWNER', isPrimaryOwner: true },
      })
    })

    it('gives a User who is a member of no Event an empty list', async () => {
      await expect(as(NO_EVENTS).list()).resolves.toEqual([])
    })

    it('counts the PAID Contributions of each Event', async () => {
      const events = await as(SUPER_ADMIN).list()

      expect(Object.fromEntries(events.map((e) => [e.id, e.paidContributionCount]))).toEqual({
        12: 3,
        15: 2,
        14: 1,
        16: 0,
        9: 0,
        17: 2,
      })
    })

    it("sums up each Event: its RSVPs, its VERIFIED Contributions' amount, its Registry items", async () => {
      const events = await as(SUPER_ADMIN).list()

      expect(Object.fromEntries(events.map((e) => [e.id, e.summary]))).toEqual({
        12: { rsvpCount: 5, verifiedAmount: 1090, registryItemCount: 5 },
        15: { rsvpCount: 3, verifiedAmount: 0, registryItemCount: 2 },
        14: { rsvpCount: 3, verifiedAmount: 520, registryItemCount: 2 },
        16: { rsvpCount: 1, verifiedAmount: 0, registryItemCount: 0 },
        9: { rsvpCount: 2, verifiedAmount: 150, registryItemCount: 1 },
        17: { rsvpCount: 4, verifiedAmount: 350, registryItemCount: 3 },
      })
    })

    it("gives a Manager an archived Event's summary, though not its Guests", async () => {
      const events = await as(KORA_MANAGER).list()

      expect(events.find((e) => e.id === 9)?.summary.rsvpCount).toBe(2)
    })

    it('describes each Event as the API does', async () => {
      const events = await as(SUPER_ADMIN).list()

      expect(events.find((e) => e.id === 9)).toMatchObject({
        name: 'Offsite Kora 2026',
        type: 'CORPORATE',
        status: 'ARCHIVED',
        startsAt: '2026-09-12T12:00:00.000Z',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        venueName: 'Hotel Boa Vista',
        city: 'Porto Feliz, SP',
      })
    })

    it('rejects a request without a Session with UNAUTHENTICATED', async () => {
      await expect(createRepository(null).list()).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      })
    })
  })

  describe('get(id)', () => {
    it('gives a member the Event with their Membership, as list() does', async () => {
      const repo = as(CLAUDIA)
      const fromList = (await repo.list()).find((e) => e.id === 14)

      await expect(repo.get(14)).resolves.toEqual(fromList)
      expect(fromList?.membership).toEqual({ role: 'MANAGER', isPrimaryOwner: false })
    })

    it("gives a Manager an archived Event's summary", async () => {
      await expect(as(KORA_MANAGER).get(9)).resolves.toMatchObject({
        summary: { rsvpCount: 2, verifiedAmount: 150, registryItemCount: 1 },
      })
    })

    it('gives the Super admin any Event, with no Membership', async () => {
      await expect(as(SUPER_ADMIN).get(16)).resolves.toMatchObject({
        name: 'Festa de fim de ano Vera Cruz',
        membership: null,
      })
    })

    it('refuses a non-member with FORBIDDEN', async () => {
      await expect(as(CLAUDIA).get(16)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Você não tem permissão para esta ação.',
      })
    })

    it('answers FORBIDDEN, not NOT_FOUND, to a non-member for a missing Event', async () => {
      await expect(as(CLAUDIA).get(999)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('answers NOT_FOUND to the Super admin for a missing Event', async () => {
      await expect(as(SUPER_ADMIN).get(999)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })
})
