import { createHttpClient } from '@/shared/lib/http'
import { createMockBackend, mockTokenFor } from '@/shared/mock-backend'
import { BASE_URL, createFakeApi } from '@/shared/mock-backend/fake-api'

import { createHttpMembersRepository, type MembersRepository } from '../api'
import { createMockMembersRepository } from '../mock'

/** A repository for the sample User with that id, or for no Session (`null`). */
type CreateRepository = (userId: number | null) => MembersRepository

const implementations: [string, CreateRepository][] = [
  [
    'mock',
    (userId) => {
      const backend = createMockBackend()
      const getRequester = () => (userId === null ? null : backend.user(userId))
      return createMockMembersRepository({ getRequester, backend })
    },
  ],
  [
    'HTTP',
    (userId) =>
      createHttpMembersRepository(
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

describe.each(implementations)('MembersRepository contract (%s)', (_, createRepository) => {
  const as = (userId: number) => createRepository(userId)

  describe('list(eventId)', () => {
    it('gives a member every Event member, with name, role and Primary owner', async () => {
      await expect(as(CLAUDIA).list(15)).resolves.toEqual([
        { userId: 5, name: 'Júlia Martins', role: 'OWNER', isPrimaryOwner: true },
        { userId: 7, name: 'Cláudia Lima', role: 'VIEWER', isPrimaryOwner: false },
      ])
    })

    it('gives the Super admin the members of any Event, even one with none', async () => {
      await expect(as(SUPER_ADMIN).list(14)).resolves.toHaveLength(2)
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
      await expect(createRepository(null).list(15)).rejects.toMatchObject({
        code: 'UNAUTHENTICATED',
      })
    })
  })
})
