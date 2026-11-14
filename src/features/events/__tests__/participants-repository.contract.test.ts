import { contractImplementations } from '@/shared/mock-backend/__tests__/contract'

import { createHttpEventsRepository, createHttpParticipantsRepository } from '../api'
import { createMockEventsRepository, createMockParticipantsRepository } from '../mock'

/** Both repositories over one backend: creating an Event and reading its Participants. */
const implementations = contractImplementations(
  (options) => ({
    events: createMockEventsRepository(options),
    participants: createMockParticipantsRepository(options),
  }),
  (http) => ({
    events: createHttpEventsRepository(http),
    participants: createHttpParticipantsRepository(http),
  }),
)

const BRUNO = 'bruno.reis@example.com'
const LU = 'lu.andrade@example.com'
const ADMIN = 'admin@local.test'

const SAIDA_BH = {
  name: 'Saída BH',
  place: 'Belo Horizonte, MG',
  period: { startDate: '2026-12-04', endDate: '2026-12-06', timezone: 'America/Sao_Paulo' },
}

// Vocal Livre: Bruno (Owner), Matias, Jacque, Lu and Tiago (Viewers, Tiago pending).
// Teams: Produção [Bruno], Cantores [Jacque, Lu], Banda [Matias], Técnica [Matias].
const ids = (list: { userId: number }[]) => list.map((p) => p.userId).sort((a, b) => a - b)

describe.each(implementations)('ParticipantsRepository contract (%s)', (_, createRepository) => {
  it("lists an Event's Participants with name, phone and role, for any Group member", async () => {
    const { participants } = createRepository(LU)

    const list = await participants.list(4)

    expect(list).toEqual([
      { userId: 3, name: 'Matias Costa', phone: '+5527999990003', role: 'VIEWER' },
    ])
  })

  it('shows the list to a Group member who is not going too', async () => {
    const { participants } = createRepository(LU)

    await expect(participants.list(4)).resolves.toHaveLength(1)
  })

  it('answers NOT_FOUND to someone outside the Group', async () => {
    const { participants } = createRepository(BRUNO)

    await expect(participants.list(7)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('creates an Event with every Group member of the moment as a Participant', async () => {
    const { events, participants } = createRepository(BRUNO)

    const created = await events.create(1, SAIDA_BH)

    expect(created.isParticipant).toBe(true)
    expect(ids(await participants.list(created.id))).toEqual([2, 3, 4, 5, 9])
  })

  it('creates an Event with the people of the Teams chosen, once each', async () => {
    const { events, participants } = createRepository(BRUNO)

    const created = await events.create(1, { ...SAIDA_BH, participantsFrom: { teamIds: [5, 6] } })

    expect(created.isParticipant).toBe(false)
    expect(ids(await participants.list(created.id))).toEqual([3])
  })

  it('unites several Teams', async () => {
    const { events, participants } = createRepository(BRUNO)

    const created = await events.create(1, { ...SAIDA_BH, participantsFrom: { teamIds: [2, 4] } })

    expect(ids(await participants.list(created.id))).toEqual([2, 4, 5])
  })

  it('answers NOT_FOUND for a Team of another Group, creating nothing', async () => {
    const { events } = createRepository(ADMIN)

    await expect(
      events.create(2, { ...SAIDA_BH, participantsFrom: { teamIds: [4] } }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
    expect(await events.listByGroup(2)).toHaveLength(1)
  })

  it('refuses no Team at all with VALIDATION_ERROR', async () => {
    const { events } = createRepository(BRUNO)

    await expect(
      events.create(1, { ...SAIDA_BH, participantsFrom: { teamIds: [] } }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'participantsFrom.teamIds' })],
    })
  })

  it('adds a Group member to the Participants', async () => {
    const { participants } = createRepository(BRUNO)

    await participants.add(4, 5)

    expect(ids(await participants.list(4))).toEqual([3, 5])
  })

  it('changes nothing adding someone who is already going', async () => {
    const { participants } = createRepository(BRUNO)

    await participants.add(4, 3)

    expect(ids(await participants.list(4))).toEqual([3])
  })

  it('takes someone out of the Participants', async () => {
    const { participants } = createRepository(BRUNO)

    await participants.remove(3, 4)

    expect(ids(await participants.list(3))).toEqual([2, 3, 5])
  })

  it('answers NOT_FOUND taking out someone who is not going', async () => {
    const { participants } = createRepository(BRUNO)

    await expect(participants.remove(4, 5)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('answers NOT_FOUND adding someone who is not a Group member', async () => {
    const { participants } = createRepository(BRUNO)

    await expect(participants.add(4, 8)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('refuses a Viewer with FORBIDDEN', async () => {
    const { participants } = createRepository(LU)

    await expect(participants.add(4, 5)).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(participants.remove(4, 3)).rejects.toMatchObject({ code: 'FORBIDDEN' })
  })

  it('refuses changes to a Cancelled Event with EVENT_CANCELLED', async () => {
    const { participants } = createRepository(BRUNO)

    await expect(participants.remove(5, 4)).rejects.toMatchObject({ code: 'EVENT_CANCELLED' })
  })

  it('lets the Super admin change them', async () => {
    const { participants } = createRepository(ADMIN)

    await participants.remove(7, 5)

    expect(ids(await participants.list(7))).toEqual([8])
  })

  it('refuses with UNAUTHENTICATED when signed out', async () => {
    const { participants } = createRepository(null)

    await expect(participants.list(3)).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})
