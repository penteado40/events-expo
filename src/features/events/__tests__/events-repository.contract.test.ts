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

const BRUNO = 'bruno.reis@example.com'
const ADMIN = 'admin@local.test'

const SAIDA_BH = {
  name: '  Saída BH ',
  place: ' Belo Horizonte, MG ',
  period: { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' },
}

describe.each(implementations)('EventsRepository contract, writing (%s)', (_, createRepository) => {
  it('creates the Event in Draft, with where and when as given, trimmed', async () => {
    const repo = createRepository(BRUNO)

    const created = await repo.create(1, SAIDA_BH)

    expect(created).toEqual({
      id: expect.any(Number),
      groupId: 1,
      name: 'Saída BH',
      place: 'Belo Horizonte, MG',
      period: { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' },
      status: 'DRAFT',
      cancelled: false,
      isParticipant: false,
    })
  })

  it('lists the new Event in the Group', async () => {
    const repo = createRepository(BRUNO)
    const created = await repo.create(1, SAIDA_BH)

    const events = await repo.listByGroup(1)

    expect(events.find((e) => e.id === created.id)).toMatchObject({
      name: 'Saída BH',
      status: 'DRAFT',
    })
  })

  it('creates an Event of one day', async () => {
    const repo = createRepository(BRUNO)

    const created = await repo.create(1, {
      ...SAIDA_BH,
      period: { ...SAIDA_BH.period, endDate: '2026-12-04' },
    })

    expect(created.period).toMatchObject({ startDate: '2026-12-04', endDate: '2026-12-04' })
  })

  it('lets the Super admin create an Event in any Group', async () => {
    const repo = createRepository(ADMIN)

    await expect(repo.create(2, SAIDA_BH)).resolves.toMatchObject({ groupId: 2 })
  })

  it('refuses an end before the start with VALIDATION_ERROR on the end date', async () => {
    const repo = createRepository(BRUNO)

    await expect(
      repo.create(1, { ...SAIDA_BH, period: { ...SAIDA_BH.period, endDate: '2026-12-03' } }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'period.endDate' })],
    })
  })

  it.each([
    ['a blank name', { name: '  ' }, 'name'],
    ['a blank place', { place: '' }, 'place'],
    [
      'an unknown timezone',
      { period: { ...SAIDA_BH.period, timezone: 'Mars/Olympus' } },
      'period.timezone',
    ],
    [
      'a date that does not exist',
      { period: { ...SAIDA_BH.period, startDate: '2026-02-30' } },
      'period.startDate',
    ],
  ])('refuses %s with VALIDATION_ERROR naming the field', async (_, change, path) => {
    const repo = createRepository(BRUNO)

    await expect(repo.create(1, { ...SAIDA_BH, ...change })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path })],
    })
  })

  it('refuses a Viewer with FORBIDDEN', async () => {
    const repo = createRepository(LU)

    await expect(repo.create(1, SAIDA_BH)).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('answers NOT_FOUND to someone outside the Group', async () => {
    const repo = createRepository(BRUNO)

    await expect(repo.create(2, SAIDA_BH)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('reads one Event, for any Group member', async () => {
    const repo = createRepository(LU)

    await expect(repo.get(3)).resolves.toMatchObject({
      id: 3,
      name: 'Saída Manaus',
      period: { startDate: '2026-11-20', endDate: '2026-11-22', timezone: 'America/Manaus' },
      isParticipant: true,
    })
  })

  it('answers NOT_FOUND to read an Event of another Group, or none', async () => {
    const repo = createRepository(BRUNO)

    await expect(repo.get(7)).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(repo.get(99)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('edits name, place, timezone and dates, and keeps the change', async () => {
    const repo = createRepository(BRUNO)

    await repo.update(2, {
      name: 'Turnê Minas Gerais',
      place: 'Ouro Preto, MG',
      period: { startDate: '2027-03-13', endDate: '2027-03-15', timezone: 'America/Sao_Paulo' },
    })

    await expect(repo.get(2)).resolves.toMatchObject({
      name: 'Turnê Minas Gerais',
      place: 'Ouro Preto, MG',
      period: { startDate: '2027-03-13', endDate: '2027-03-15' },
      status: 'DRAFT',
    })
  })

  it('changes only what it is given', async () => {
    const repo = createRepository(BRUNO)

    const edited = await repo.update(3, { name: 'Saída Manaus 2026' })

    expect(edited).toMatchObject({ name: 'Saída Manaus 2026', place: 'Manaus, AM' })
  })

  it('edits a Finished event', async () => {
    const repo = createRepository(BRUNO)

    await expect(repo.update(1, { place: 'Serra, ES' })).resolves.toMatchObject({
      name: 'Gravação do clipe',
      place: 'Serra, ES',
    })
  })

  it('refuses an edit that ends before it starts with VALIDATION_ERROR', async () => {
    const repo = createRepository(BRUNO)

    await expect(
      repo.update(3, {
        period: { startDate: '2026-11-22', endDate: '2026-11-20', timezone: 'America/Manaus' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('refuses a Viewer with FORBIDDEN, and someone outside the Group with NOT_FOUND', async () => {
    await expect(createRepository(LU).update(3, { name: 'X' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(createRepository(BRUNO).update(7, { name: 'X' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('refuses with UNAUTHENTICATED when signed out', async () => {
    const repo = createRepository(null)

    await expect(repo.create(1, SAIDA_BH)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
    await expect(repo.update(3, { name: 'X' })).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
