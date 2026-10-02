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
const OTAVIO = 8
const OFFSITE_KORA = 9 // archived: Cláudia is its Owner, Otávio its Manager

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
        registryItemId: 121,
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

    it("keeps an archived Event's Contributions for its Owners and the Super admin", async () => {
      const ids = async (userId: number) => (await as(userId).list(OFFSITE_KORA)).map((c) => c.id)

      await expect(ids(CLAUDIA)).resolves.toEqual([201])
      await expect(ids(SUPER_ADMIN)).resolves.toEqual([201])
    })

    it("refuses an archived Event's Contributions to a Manager with FORBIDDEN", async () => {
      await expect(as(OTAVIO).list(OFFSITE_KORA)).rejects.toMatchObject({ code: 'FORBIDDEN' })
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

  describe('getReceiptUrl(eventId, contributionId)', () => {
    it('gives a member a URL to the Receipt of a Contribution that has one', async () => {
      const url = await as(CLAUDIA).getReceiptUrl(12, 301)

      expect(url).toMatch(/^https:\/\//)
    })

    it('gives a Viewer the Receipt too (it is visible to every member)', async () => {
      await expect(as(CLAUDIA).getReceiptUrl(15, 412)).resolves.toMatch(/^https:\/\//)
    })

    it('answers NOT_FOUND for a Contribution without a Receipt', async () => {
      await expect(as(CLAUDIA).getReceiptUrl(12, 302)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it("answers NOT_FOUND for a Contribution the members' list doesn't have", async () => {
      await expect(as(CLAUDIA).getReceiptUrl(12, 304)).rejects.toMatchObject({ code: 'NOT_FOUND' })
      await expect(as(CLAUDIA).getReceiptUrl(12, 999)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it("refuses an archived Event's Receipts to a Manager with FORBIDDEN", async () => {
      await expect(as(OTAVIO).getReceiptUrl(OFFSITE_KORA, 1)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      })
    })

    it('refuses a non-member with FORBIDDEN', async () => {
      await expect(as(CLAUDIA).getReceiptUrl(16, 301)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe.each([
    ['verify', 'VERIFIED', 'REJECTED'],
    ['reject', 'REJECTED', 'VERIFIED'],
  ] as const)('%s(eventId, contributionId)', (action, outcome, other) => {
    it(`moves a PAID Contribution to ${outcome} and answers it`, async () => {
      const repository = as(CLAUDIA)

      const contribution = await repository[action](12, 301)

      expect(contribution).toMatchObject({
        id: 301,
        status: outcome,
        guestName: 'Beatriz Nogueira',
      })
      const listed = await repository.list(12)
      expect(listed.find((c) => c.id === 301)?.status).toBe(outcome)
    })

    it(`revises a ${other} Contribution to ${outcome}`, async () => {
      const repository = as(CLAUDIA)
      await repository[action === 'verify' ? 'reject' : 'verify'](12, 302)

      await expect(repository[action](12, 302)).resolves.toMatchObject({ status: outcome })
    })

    it(`leaves a Contribution already ${outcome} as it is`, async () => {
      const repository = as(CLAUDIA)
      await repository[action](12, 301)

      await expect(repository[action](12, 301)).resolves.toMatchObject({ status: outcome })
    })

    it('refuses a Contribution not marked paid with CONTRIBUTION_NOT_PAID', async () => {
      const repository = as(CLAUDIA)

      await expect(repository[action](12, 304)).rejects.toMatchObject({
        code: 'CONTRIBUTION_NOT_PAID',
      })
      await expect(repository[action](12, 296)).rejects.toMatchObject({
        code: 'CONTRIBUTION_NOT_PAID',
      })
    })

    it('lets a Manager and the Super admin do it too', async () => {
      await expect(as(CLAUDIA)[action](14, 388)).resolves.toMatchObject({ status: outcome })
      await expect(as(SUPER_ADMIN)[action](12, 301)).resolves.toMatchObject({ status: outcome })
    })

    it('refuses a Viewer with FORBIDDEN, and changes nothing', async () => {
      const repository = as(CLAUDIA)

      await expect(repository[action](15, 412)).rejects.toMatchObject({ code: 'FORBIDDEN' })
      const listed = await repository.list(15)
      expect(listed.find((c) => c.id === 412)?.status).toBe('PAID')
    })

    it("keeps an archived Event's Verification for its Owners and the Super admin", async () => {
      const owner = as(CLAUDIA)
      // 201 is VERIFIED: reject it first, so verifying it is a change.
      if (action === 'verify') await owner.reject(OFFSITE_KORA, 201)

      await expect(owner[action](OFFSITE_KORA, 201)).resolves.toMatchObject({ status: outcome })
      await expect(as(SUPER_ADMIN)[action](OFFSITE_KORA, 201)).resolves.toMatchObject({
        status: outcome,
      })
    })

    it("refuses an archived Event's Manager with EVENT_ARCHIVED", async () => {
      await expect(as(OTAVIO)[action](OFFSITE_KORA, 201)).rejects.toMatchObject({
        code: 'EVENT_ARCHIVED',
      })
    })

    it('refuses a non-member with FORBIDDEN', async () => {
      await expect(as(CLAUDIA)[action](16, 301)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })

    it("answers NOT_FOUND for a Contribution the Event doesn't have", async () => {
      await expect(as(CLAUDIA)[action](12, 999)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it("fails the sample's sabotaged Contribution with INTERNAL_ERROR (Demo mode's rollback)", async () => {
      const repository = as(CLAUDIA)

      await expect(repository[action](12, 303)).rejects.toMatchObject({ code: 'INTERNAL_ERROR' })
      const listed = await repository.list(12)
      expect(listed.find((c) => c.id === 303)?.status).toBe('PAID')
    })
  })
})
