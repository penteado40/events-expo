import { createMockBackend } from '../backend'

/** A real Clerk user whom the API knows but the sample data does not. */
const LIVE_STRANGER = { email: 'felipe@example.com' }

describe('mock backend with a Live session', () => {
  it('still refuses an email of no User at sign-in (GET /me)', async () => {
    await expect(createMockBackend().me(LIVE_STRANGER)).rejects.toMatchObject({
      code: 'USER_NOT_INVITED',
    })
  })

  it('answers a module not live yet as if the User were in no Group, never USER_NOT_INVITED', async () => {
    const backend = createMockBackend()

    await expect(backend.groups(LIVE_STRANGER)).resolves.toEqual([])
    await expect(backend.groupEvents(LIVE_STRANGER, 1)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('keeps refusing a Deactivated user and a signed-out request', async () => {
    const backend = createMockBackend()

    await expect(backend.groups({ email: 'carla.dias@example.com' })).rejects.toMatchObject({
      code: 'USER_DEACTIVATED',
    })
    await expect(backend.groups(null)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})

describe('mock backend, Participants born of Teams', () => {
  const BRUNO = { email: 'bruno.reis@example.com' }
  const period = { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' }

  it('keeps them as copied when the Team changes later', async () => {
    const backend = createMockBackend()
    const created = await backend.createEvent(BRUNO, 1, {
      name: 'Ensaio dos Cantores',
      place: 'Sede',
      period,
      participantsFrom: { teamIds: [4] },
    })

    await backend.removeTeamMember(BRUNO, 1, 4, 4)
    await backend.addTeamMember(BRUNO, 1, 4, 3)

    const participants = await backend.participants(BRUNO, created.id)
    expect(participants.map((p) => p.userId).sort()).toEqual([4, 5])
  })
})

describe('mock backend, the schedule by Audience', () => {
  const BRUNO = { email: 'bruno.reis@example.com' }
  const LU = { email: 'lu.andrade@example.com' }
  const MANAUS = 3
  const PASSAGEM = 6
  const items = async (backend: ReturnType<typeof createMockBackend>) => {
    const { generalInfo, timeline } = await backend.schedule(BRUNO, MANAUS)
    return [...generalInfo, ...timeline.flatMap((d) => d.items)].map((i) => i.id)
  }

  it('gives the Owner every item, even one whose chosen list leaves him out', async () => {
    const backend = createMockBackend()
    await backend.updateItem(BRUNO, MANAUS, PASSAGEM, {
      audience: { kind: 'SELECTED', userIds: [5] },
    })

    expect(await items(backend)).toContain(PASSAGEM)
  })

  const seenBy = async (backend: ReturnType<typeof createMockBackend>, who: { email: string }) => {
    const { generalInfo, timeline } = await backend.schedule(who, MANAUS)
    return [...generalInfo, ...timeline.flatMap((d) => d.items)].map((i) => i.id)
  }

  it('gives a Participant only the items that reach them, never one in Draft', async () => {
    const backend = createMockBackend()
    await backend.updateItem(BRUNO, MANAUS, PASSAGEM, {
      audience: { kind: 'SELECTED', userIds: [3] },
    })
    const draft = await backend.createItem(BRUNO, MANAUS, { name: 'Coletiva', date: '2026-11-21' })

    const seen = await seenBy(backend, LU)

    expect(seen).not.toContain(PASSAGEM)
    expect(seen).not.toContain(draft.id)
    expect(seen).toContain(5)
  })

  it('keeps a Cancelled item for a Participant, frozen for reference', async () => {
    const backend = createMockBackend()
    await backend.cancelItem(BRUNO, MANAUS, PASSAGEM)

    expect(await seenBy(backend, LU)).toContain(PASSAGEM)
  })

  it('shows a Participant the items of an Event once published', async () => {
    const backend = createMockBackend()
    const created = await backend.createEvent(BRUNO, 1, {
      name: 'Saída BH',
      place: 'Belo Horizonte, MG',
      period: { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' },
    })
    await backend.createItem(BRUNO, created.id, { name: 'Hotel', date: '2026-12-04' })
    const items = async () => (await backend.schedule(LU, created.id)).timeline.length

    expect(await items()).toBe(0)
    await backend.publishEvent(BRUNO, created.id)
    expect(await items()).toBe(1)
  })
})
