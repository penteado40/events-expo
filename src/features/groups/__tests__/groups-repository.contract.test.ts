import { contractImplementations } from '@/shared/mock-backend/__tests__/contract'

import { createHttpGroupsRepository } from '../api'
import { createMockGroupsRepository } from '../mock'

const implementations = contractImplementations(
  createMockGroupsRepository,
  createHttpGroupsRepository,
)

describe.each(implementations)('GroupsRepository contract (%s)', (_, createRepository) => {
  it('lists the Groups the User is a Group member of, by name', async () => {
    const repo = createRepository('lu.andrade@example.com')

    await expect(repo.list()).resolves.toEqual([
      { id: 2, name: 'Coral Jovem Vitória' },
      { id: 1, name: 'Vocal Livre' },
    ])
  })

  it('never lists a Group the User is not a Group member of', async () => {
    const repo = createRepository('bruno.reis@example.com')

    await expect(repo.list()).resolves.toEqual([{ id: 1, name: 'Vocal Livre' }])
  })

  it('lists every Group of the platform for the Super admin', async () => {
    const repo = createRepository('admin@local.test')

    await expect(repo.list()).resolves.toHaveLength(2)
  })

  it('lists nothing for a User no Owner has added to a Group yet', async () => {
    const repo = createRepository('rita.souza@example.com')

    await expect(repo.list()).resolves.toEqual([])
  })

  it('refuses with UNAUTHENTICATED when signed out', async () => {
    const repo = createRepository(null)

    await expect(repo.list()).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })

  describe('members', () => {
    it("lists the Group's members with role, phone and pending invitation", async () => {
      const repo = createRepository('lu.andrade@example.com')

      const members = await repo.listMembers(1)

      expect(members).toContainEqual({
        userId: 3,
        name: 'Matias Costa',
        email: 'matias.costa@example.com',
        phone: '+5527999990003',
        role: 'VIEWER',
        isPending: false,
      })
      expect(members).toContainEqual(
        expect.objectContaining({ name: 'Bruno Reis', role: 'OWNER', isPending: false }),
      )
      expect(members).toContainEqual(
        expect.objectContaining({ name: 'Tiago Souza', role: 'VIEWER', isPending: true }),
      )
    })

    it('shows any Group to the Super admin', async () => {
      const repo = createRepository('admin@local.test')

      await expect(repo.listMembers(2)).resolves.toHaveLength(2)
    })

    it('answers NOT_FOUND to someone outside the Group', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.listMembers(2)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('refuses with UNAUTHENTICATED when signed out', async () => {
      const repo = createRepository(null)

      await expect(repo.listMembers(1)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    })
  })

  describe('Teams', () => {
    it("lists the Group's Teams by name, with who is in each", async () => {
      const repo = createRepository('lu.andrade@example.com')

      await expect(repo.listTeams(1)).resolves.toEqual([
        { id: 5, name: 'Banda', memberIds: [3] },
        { id: 4, name: 'Cantores', memberIds: [4, 5] },
        { id: 2, name: 'Produção', memberIds: [2] },
        { id: 6, name: 'Técnica', memberIds: [3] },
      ])
    })

    it('answers NOT_FOUND to someone outside the Group', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.listTeams(2)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })
  })
})
