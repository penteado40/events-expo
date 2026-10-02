import { createMockBackend } from '../backend'
import { DEMO_USER_ID, SAMPLE_DATE, SUPER_ADMIN_ID } from '../data'

const loadedAt = (iso: string) => {
  const backend = createMockBackend({ now: new Date(iso) })
  const admin = backend.user(SUPER_ADMIN_ID)
  const startsAt = async (id: number) =>
    (await backend.listEvents(admin)).find((e) => e.id === id)?.startsAt
  return { backend, admin, startsAt }
}

describe('the sample dates', () => {
  it('are the written ones when the mock loads on SAMPLE_DATE', async () => {
    const { startsAt } = loadedAt(SAMPLE_DATE.toISOString())

    await expect(startsAt(15)).resolves.toBe('2026-10-11T18:00:00.000Z')
  })

  it('keep each Event the same days away, at the same time of day, on any day', async () => {
    // 20/03/2027, 09:00 in São Paulo.
    const { startsAt } = loadedAt('2027-03-20T12:00:00.000Z')

    await expect(startsAt(15)).resolves.toBe('2027-03-30T18:00:00.000Z') // Chá da Júlia, +10
    await expect(startsAt(14)).resolves.toBe('2027-04-12T23:00:00.000Z') // Marcos, 40, +23
    await expect(startsAt(12)).resolves.toBe('2027-05-03T19:30:00.000Z') // Ana & Rafael, +44
    await expect(startsAt(16)).resolves.toBe('2027-05-31T22:00:00.000Z') // Vera Cruz, +72
    await expect(startsAt(9)).resolves.toBe('2027-03-01T12:00:00.000Z') // Offsite Kora, −19
  })

  it("count the days on São Paulo's calendar", async () => {
    // Already 21/03 in UTC, still 22:30 on 20/03 in São Paulo.
    const { startsAt } = loadedAt('2027-03-21T01:30:00.000Z')

    await expect(startsAt(15)).resolves.toBe('2027-03-30T18:00:00.000Z')
  })

  it("move an Event's RSVPs and Contributions along with it", async () => {
    const { backend, admin } = loadedAt('2027-03-20T12:00:00.000Z')

    const rsvps = await backend.listRsvps(admin, 15)
    const contributions = await backend.listContributions(admin, 15)

    expect(rsvps.find((r) => r.name === 'Marina Alves')?.createdAt).toBe('2027-03-12T15:00:00.000Z')
    expect(contributions.find((c) => c.id === 412)?.paidAt).toBe('2027-03-13T12:20:00.000Z')
  })
})

describe('the Event happening when the mock loads', () => {
  it('started 2 h earlier, has no end and is active, with Cláudia as its Primary owner', async () => {
    const { backend } = loadedAt('2027-03-20T18:00:00.000Z')

    const event = (await backend.listEvents(backend.user(DEMO_USER_ID))).find((e) => e.id === 17)

    expect(event).toMatchObject({
      name: 'Aniversário da Cláudia',
      startsAt: '2027-03-20T16:00:00.000Z',
      endsAt: null,
      status: 'ACTIVE',
      membership: { role: 'OWNER', isPrimaryOwner: true },
    })
  })

  it("starts no earlier than today's midnight in São Paulo, so it's still on", async () => {
    // 00:30 in São Paulo.
    const { startsAt } = loadedAt('2027-03-20T03:30:00.000Z')

    await expect(startsAt(17)).resolves.toBe('2027-03-20T03:00:00.000Z')
  })

  it('got its RSVPs and Contributions before it started', async () => {
    const { backend, admin, startsAt } = loadedAt('2027-03-20T18:00:00.000Z')
    const start = Date.parse((await startsAt(17)) ?? '')

    const rsvps = await backend.listRsvps(admin, 17)
    const contributions = await backend.listContributions(admin, 17)

    expect(rsvps).toHaveLength(4)
    expect(contributions.map((c) => c.status).sort()).toEqual([
      'PAID',
      'PAID',
      'REJECTED',
      'VERIFIED',
    ])
    const dates = [...rsvps.map((r) => r.createdAt), ...contributions.map((c) => c.paidAt)]
    expect(dates.filter((iso) => iso === null || Date.parse(iso) >= start)).toEqual([])
  })
})
