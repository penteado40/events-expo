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

  describe('adding a Viewer', () => {
    const newPerson = {
      name: 'Paula Lima',
      email: 'paula.lima@example.com',
      phone: '+55 27 98888-1234',
    }

    it('adds a new email as a pending Viewer, with the Activation link to pass on', async () => {
      const repo = createRepository('bruno.reis@example.com')

      const added = await repo.addViewer(1, newPerson)

      expect(added).toEqual({
        userId: expect.any(Number),
        name: 'Paula Lima',
        email: 'paula.lima@example.com',
        isPending: true,
        activationLink: {
          url: expect.stringMatching(/^https:\/\//),
          expiresAt: expect.any(String),
        },
      })
      await expect(repo.listMembers(1)).resolves.toContainEqual({
        userId: added.userId,
        name: 'Paula Lima',
        email: 'paula.lima@example.com',
        phone: '+5527988881234',
        role: 'VIEWER',
        isPending: true,
      })
    })

    it('adds a User who already has an account with no link: they are only told', async () => {
      const repo = createRepository('bruno.reis@example.com')

      const added = await repo.addViewer(1, {
        name: 'Outro nome',
        email: 'ana.prado@example.com',
        phone: '+55 27 90000-0000',
      })

      expect(added).toEqual({
        userId: 8,
        name: 'Ana Prado',
        email: 'ana.prado@example.com',
        isPending: false,
        activationLink: null,
      })
    })

    it('refuses someone already in the Group with ALREADY_A_GROUP_MEMBER', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(
        repo.addViewer(1, { ...newPerson, email: 'matias.costa@example.com' }),
      ).rejects.toMatchObject({
        code: 'ALREADY_A_GROUP_MEMBER',
        message: 'Esta pessoa já é Group member deste Group.',
      })
    })

    it('refuses the Super admin with SUPER_ADMIN_NOT_A_GROUP_MEMBER', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(
        repo.addViewer(1, { ...newPerson, email: 'admin@local.test' }),
      ).rejects.toMatchObject({ code: 'SUPER_ADMIN_NOT_A_GROUP_MEMBER' })
    })

    it('refuses a Viewer with FORBIDDEN', async () => {
      const repo = createRepository('lu.andrade@example.com')

      await expect(repo.addViewer(1, newPerson)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: 'Você não tem permissão para esta ação.',
      })
    })

    it('answers NOT_FOUND to someone outside the Group', async () => {
      const repo = createRepository('ana.prado@example.com')

      await expect(repo.addViewer(1, newPerson)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('refuses an invalid phone for a new email with VALIDATION_ERROR', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.addViewer(1, { ...newPerson, phone: '27 9999' })).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    })
  })

  describe('a new Activation link', () => {
    it('gives a pending Group member a new link; the previous one stops working', async () => {
      const repo = createRepository('bruno.reis@example.com')
      const { userId, activationLink } = await repo.addViewer(1, {
        name: 'Paula Lima',
        email: 'paula.lima@example.com',
        phone: '+5527988881234',
      })

      const fresh = await repo.reissueActivationLink(1, userId)

      expect(fresh).toEqual({
        url: expect.stringMatching(/^https:\/\//),
        expiresAt: expect.any(String),
      })
      expect(fresh.url).not.toBe(activationLink!.url)
    })

    it('refuses someone who already signed in with USER_ALREADY_ACTIVE', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.reissueActivationLink(1, 3)).rejects.toMatchObject({
        code: 'USER_ALREADY_ACTIVE',
      })
    })

    it('answers NOT_FOUND for someone outside the Group', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.reissueActivationLink(1, 8)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('refuses a Viewer with FORBIDDEN', async () => {
      const repo = createRepository('lu.andrade@example.com')

      await expect(repo.reissueActivationLink(1, 9)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('removing a Viewer', () => {
    it('takes the Viewer out of the Group and of its Teams', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await repo.removeViewer(1, 3)

      const members = await repo.listMembers(1)
      expect(members.map((m) => m.userId)).not.toContain(3)
      const teams = await repo.listTeams(1)
      expect(teams.find((t) => t.name === 'Banda')).toEqual({ id: 5, name: 'Banda', memberIds: [] })
    })

    it('answers NOT_FOUND for an Owner: Owners leave by the Owner routes', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.removeViewer(1, 2)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('refuses a Viewer with FORBIDDEN', async () => {
      const repo = createRepository('lu.andrade@example.com')

      await expect(repo.removeViewer(1, 3)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })

  describe('Team members (PROJ-183, planned)', () => {
    it('puts a Group member in a Team', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await repo.addTeamMember(1, 5, 4)

      const teams = await repo.listTeams(1)
      expect(teams.find((t) => t.id === 5)?.memberIds).toEqual([3, 4])
    })

    it('answers NOT_FOUND for someone who is not a Group member', async () => {
      const repo = createRepository('bruno.reis@example.com')

      await expect(repo.addTeamMember(1, 5, 8)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    })

    it('refuses a Viewer with FORBIDDEN', async () => {
      const repo = createRepository('lu.andrade@example.com')

      await expect(repo.addTeamMember(1, 5, 4)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    })
  })
})
