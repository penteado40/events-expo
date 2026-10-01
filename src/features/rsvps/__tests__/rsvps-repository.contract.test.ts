import { createHttpClient } from '@/shared/lib/http'
import { createMockBackend, mockTokenFor } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi } from '@/shared/mock-backend/fake-api'

import { createHttpRsvpsRepository, type RsvpsRepository } from '../api'
import { createMockRsvpsRepository } from '../mock'

/** A repository for the sample User with that id, or for no Session (`null`). */
type CreateRepository = (userId: number | null) => RsvpsRepository

const implementations: [string, CreateRepository][] = [
  [
    'mock',
    (userId) => {
      const backend = createMockBackend()
      const getRequester = () => (userId === null ? null : backend.user(userId))
      return createMockRsvpsRepository({ getRequester, backend })
    },
  ],
  [
    'HTTP',
    (userId) =>
      createHttpRsvpsRepository(
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
const OTAVIO = 8
const OFFSITE_KORA = 9 // archived: Cláudia is its Owner, Otávio its Manager

describe.each(implementations)('RsvpsRepository contract (%s)', (_, createRepository) => {
  const as = (userId: number) => createRepository(userId)

  describe('list(eventId)', () => {
    it('gives a member every RSVP of the Event: the Guests who confirmed', async () => {
      const rsvps = await as(CLAUDIA).list(14)

      expect(rsvps.map((r) => r.name)).toEqual(['Rodrigo Pires', 'Tiago Moura', 'Paula Reis'])
      expect(rsvps[0]).toEqual({
        name: 'Rodrigo Pires',
        email: 'rpires@gmail.com',
        createdAt: '2026-09-25T15:00:00.000Z',
      })
    })

    it('gives the Super admin the RSVPs of any Event', async () => {
      await expect(as(SUPER_ADMIN).list(16)).resolves.toHaveLength(1)
    })

    it('refuses a non-member with FORBIDDEN, even for a missing Event', async () => {
      await expect(as(CLAUDIA).list(16)).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await expect(as(CLAUDIA).list(999)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it("keeps an archived Event's RSVPs for its Owners and the Super admin", async () => {
      await expect(as(CLAUDIA).list(OFFSITE_KORA)).resolves.toHaveLength(2)
      await expect(as(SUPER_ADMIN).list(OFFSITE_KORA)).resolves.toHaveLength(2)
    })

    it("refuses an archived Event's RSVPs to a Manager with FORBIDDEN", async () => {
      await expect(as(OTAVIO).list(OFFSITE_KORA)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('answers NOT_FOUND to the Super admin for a missing Event', async () => {
      await expect(as(SUPER_ADMIN).list(999)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('rejects a request without a Session with UNAUTHENTICATED', async () => {
      await expect(createRepository(null).list(14)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      })
    })
  })
})
