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
})
