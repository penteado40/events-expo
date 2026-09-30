import { createHttpClient } from '@/shared/lib/http'
import { createMockBackend, mockTokenFor } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi } from '@/shared/mock-backend/fake-api'

import { createHttpContributionsRepository, type ContributionsRepository } from '../api'
import { createMockContributionsRepository } from '../mock'

/** A repository for the sample User with that id, or for no Session (`null`). */
type CreateRepository = (userId: number | null) => ContributionsRepository

const implementations: [string, CreateRepository][] = [
  [
    'mock',
    (userId) => {
      const backend = createMockBackend()
      const getRequester = () => (userId === null ? null : backend.user(userId))
      return createMockContributionsRepository({ getRequester, backend })
    },
  ],
  [
    'HTTP',
    (userId) =>
      createHttpContributionsRepository(
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

describe.each(implementations)('ContributionsRepository contract (%s)', (_, createRepository) => {
  const as = (userId: number) => createRepository(userId)

  describe('list(eventId)', () => {
    it('lists only the Contributions marked paid: PAID, VERIFIED and REJECTED', async () => {
      const contributions = await as(CLAUDIA).list(12)

      expect(contributions.map((c) => [c.id, c.status])).toEqual([
        [301, 'PAID'],
        [302, 'PAID'],
        [303, 'PAID'],
        [298, 'VERIFIED'],
        [295, 'VERIFIED'],
        [290, 'REJECTED'],
      ])
    })

    it('describes each Contribution as the API does', async () => {
      const contributions = await as(CLAUDIA).list(12)

      expect(contributions[0]).toEqual({
        id: 301,
        guestName: 'Beatriz Nogueira',
        amount: 450,
        status: 'PAID',
        paidAt: '2026-09-27T00:14:00.000Z',
        hasReceipt: true,
      })
    })

    it('gives a Viewer the list too (reading is open to every member)', async () => {
      await expect(as(CLAUDIA).list(15)).resolves.toHaveLength(2)
    })

    it('gives the Super admin the Contributions of any Event, even one with none', async () => {
      await expect(as(SUPER_ADMIN).list(16)).resolves.toEqual([])
    })

    it('refuses a non-member with FORBIDDEN, even for a missing Event', async () => {
      await expect(as(CLAUDIA).list(16)).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await expect(as(CLAUDIA).list(999)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('answers NOT_FOUND to the Super admin for a missing Event', async () => {
      await expect(as(SUPER_ADMIN).list(999)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('rejects a request without a Session with UNAUTHENTICATED', async () => {
      await expect(createRepository(null).list(12)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      })
    })
  })
})
