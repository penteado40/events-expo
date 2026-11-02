import { contractImplementations } from '@/shared/mock-backend/__tests__/contract'

import { createHttpEventsRepository } from '../api'
import { createMockEventsRepository } from '../mock'

const implementations = contractImplementations(
  createMockEventsRepository,
  createHttpEventsRepository,
)

const LU = 'lu.andrade@example.com'

describe.each(implementations)('EventsRepository contract (%s)', (_, createRepository) => {
  it("lists the Group's Events with where and when, in local dates", async () => {
    const repo = createRepository(LU)

    const events = await repo.listByGroup(1)

    expect(events.find((e) => e.id === 3)).toEqual({
      id: 3,
      groupId: 1,
      name: 'Saída Manaus',
      place: 'Manaus, AM',
      period: { startDate: '2026-11-20', endDate: '2026-11-22', timezone: 'America/Manaus' },
      status: 'PUBLISHED',
      cancelled: false,
      isParticipant: true,
    })
  })

  it('lists them by start date', async () => {
    const repo = createRepository(LU)

    const events = await repo.listByGroup(1)

    expect(events.map((e) => e.name)).toEqual([
      'Gravação do clipe',
      'Ensaio geral',
      'Ensaio da Banda',
      'Saída Manaus',
      'Festival de Verão',
      'Turnê Minas',
    ])
  })

  it('says whether the requester is a Participant of each', async () => {
    const repo = createRepository(LU)

    const events = await repo.listByGroup(1)
    const going = (name: string) => events.find((e) => e.name === name)?.isParticipant

    expect(going('Saída Manaus')).toBe(true)
    expect(going('Ensaio da Banda')).toBe(false)
  })

  it('shows a Viewer the where and when of an Event in Draft', async () => {
    const repo = createRepository(LU)

    const events = await repo.listByGroup(1)

    expect(events.find((e) => e.name === 'Turnê Minas')).toMatchObject({ status: 'DRAFT' })
  })

  it('keeps a Cancelled Event in the list, marked', async () => {
    const repo = createRepository(LU)

    const events = await repo.listByGroup(1)

    expect(events.find((e) => e.name === 'Festival de Verão')).toMatchObject({ cancelled: true })
  })

  it('lists only the Events of the Group asked for', async () => {
    const repo = createRepository(LU)

    await expect(repo.listByGroup(2)).resolves.toEqual([
      expect.objectContaining({ name: 'Ensaio aberto', groupId: 2 }),
    ])
  })

  it('answers NOT_FOUND to someone who is not a Group member', async () => {
    const repo = createRepository('bruno.reis@example.com')

    await expect(repo.listByGroup(2)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('lists any Group for the Super admin, who is no Participant', async () => {
    const repo = createRepository('admin@local.test')

    const events = await repo.listByGroup(2)

    expect(events).toEqual([expect.objectContaining({ isParticipant: false })])
  })

  it('answers NOT_FOUND for a Group that does not exist', async () => {
    const repo = createRepository('admin@local.test')

    await expect(repo.listByGroup(99)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('refuses with UNAUTHENTICATED when signed out', async () => {
    const repo = createRepository(null)

    await expect(repo.listByGroup(1)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
