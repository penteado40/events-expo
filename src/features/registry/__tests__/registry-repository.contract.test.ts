import { createHttpClient } from '@/shared/lib/http'
import { createMockBackend, mockTokenFor } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi } from '@/shared/mock-backend/fake-api'

import { createHttpRegistryRepository, type RegistryRepository } from '../api'
import { createMockRegistryRepository } from '../mock'

/** A repository for the sample User with that id, or for no Session (`null`). */
type CreateRepository = (userId: number | null) => RegistryRepository

const implementations: [string, CreateRepository][] = [
  [
    'mock',
    (userId) => {
      const backend = createMockBackend()
      const getRequester = () => (userId === null ? null : backend.user(userId))
      return createMockRegistryRepository({ getRequester, backend })
    },
  ],
  [
    'HTTP',
    (userId) =>
      createHttpRegistryRepository(
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
const MARCOS_40 = 14
const OFFSITE_KORA = 9 // archived, without a Registry: Otávio is its Manager

describe.each(implementations)('RegistryRepository contract (%s)', (_, createRepository) => {
  const as = (userId: number) => createRepository(userId)

  describe('list(eventId)', () => {
    it("gives a member the Event's Registry items in the API's order", async () => {
      const items = await as(CLAUDIA).list(MARCOS_40)

      expect(items).toEqual([
        {
          id: 141,
          name: 'Garrafa de single malt',
          price: 520,
          imageUrl: 'https://picsum.photos/seed/garrafa-de-single-malt/96',
          contributionCount: 1,
        },
        {
          id: 142,
          name: 'Cota do churrasco',
          price: 100,
          imageUrl: 'https://picsum.photos/seed/cota-do-churrasco/96',
          contributionCount: 1,
        },
      ])
    })

    it('counts the PAID and VERIFIED Contributions of each item, not the others', async () => {
      const items = await as(CLAUDIA).list(12)
      const count = (name: string) => items.find((i) => i.name === name)?.contributionCount

      expect(count('Jantar na lua de mel')).toBe(1) // one PAID, one REJECTED
      expect(count('Cota da viagem')).toBe(2) // PAID, VERIFIED, PENDING and ABANDONED
      expect(count('Cafeteira espresso')).toBe(0)
    })

    it('sends a Registry item without an image as null', async () => {
      const items = await as(CLAUDIA).list(12)

      expect(items.find((i) => i.name === 'Cafeteira espresso')?.imageUrl).toBeNull()
    })

    it('gives an Event without a Registry an empty list', async () => {
      await expect(as(SUPER_ADMIN).list(16)).resolves.toEqual([])
    })

    it("keeps an archived Event's Registry visible to a Manager (no Guest data)", async () => {
      const items = await as(OTAVIO).list(OFFSITE_KORA)

      expect(items.map((i) => [i.id, i.contributionCount])).toEqual([[91, 1]])
    })

    it('refuses a non-member with FORBIDDEN, even for a missing Event', async () => {
      await expect(as(CLAUDIA).list(16)).rejects.toMatchObject({ code: 'FORBIDDEN' })
      await expect(as(CLAUDIA).list(999)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it('answers NOT_FOUND to the Super admin for a missing Event', async () => {
      await expect(as(SUPER_ADMIN).list(999)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('rejects a request without a Session with UNAUTHENTICATED', async () => {
      await expect(createRepository(null).list(MARCOS_40)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      })
    })
  })
})
