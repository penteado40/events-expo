import { contractImplementations } from '@/shared/mock-backend/__tests__/contract'

import { createHttpProfileRepository } from '../api'
import { createMockProfileRepository } from '../mock'

const implementations = contractImplementations(
  createMockProfileRepository,
  createHttpProfileRepository,
)

describe.each(implementations)('ProfileRepository contract (%s)', (_, createRepository) => {
  it('edits the name and the phone, stored in E.164, and answers as GET /me', async () => {
    const repo = createRepository('lu.andrade@example.com')

    await expect(
      repo.updateMe({ name: '  Lu Andrade Lima ', phone: '+55 (27) 98888-7777' }),
    ).resolves.toEqual({
      id: 5,
      name: 'Lu Andrade Lima',
      email: 'lu.andrade@example.com',
      phone: '+5527988887777',
      isSuperAdmin: false,
      memberships: [
        { groupId: 1, groupName: 'Vocal Livre', role: 'VIEWER' },
        { groupId: 2, groupName: 'Coral Jovem Vitória', role: 'VIEWER' },
      ],
    })
  })

  it('changes only what it is given, and keeps the change', async () => {
    const repo = createRepository('bruno.reis@example.com')

    await repo.updateMe({ name: 'Bruno R.' })
    const me = await repo.updateMe({ phone: '+14155552671' })

    expect(me).toMatchObject({ name: 'Bruno R.', phone: '+14155552671' })
  })

  it.each([
    ['without the country code', '27 98888-7777'],
    ['too short', '+55 2799'],
    ['with letters', '+55 27 9888A-7777'],
  ])('refuses a phone %s with VALIDATION_ERROR', async (_, phone) => {
    const repo = createRepository('lu.andrade@example.com')

    await expect(repo.updateMe({ phone })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('refuses a blank name with VALIDATION_ERROR naming the field', async () => {
    const repo = createRepository('lu.andrade@example.com')

    await expect(repo.updateMe({ name: '   ' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'name' })],
    })
  })

  it("refuses to edit the email, which is the login's, with VALIDATION_ERROR", async () => {
    const repo = createRepository('lu.andrade@example.com')

    await expect(
      repo.updateMe({ email: 'outro@example.com' } as Parameters<typeof repo.updateMe>[0]),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('refuses a Deactivated user with USER_DEACTIVATED', async () => {
    const repo = createRepository('carla.dias@example.com')

    await expect(repo.updateMe({ name: 'Carla' })).rejects.toMatchObject({
      code: 'USER_DEACTIVATED',
    })
  })

  it('refuses with UNAUTHENTICATED when signed out of Clerk', async () => {
    const repo = createRepository(null)

    await expect(repo.updateMe({ name: 'Ninguém' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
  })
})
