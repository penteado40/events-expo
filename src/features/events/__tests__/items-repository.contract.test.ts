import type { HttpClient } from '@/shared/lib/http'
import { contractImplementations } from '@/shared/mock-backend/__tests__/contract'

import { createHttpEventItemsRepository, createHttpScheduleRepository } from '../api'
import { createMockEventItemsRepository, createMockScheduleRepository } from '../mock'

type Options = Parameters<typeof createMockEventItemsRepository>[0]

/** Items and schedule over the same backend, so a write shows in the next read. */
const implementations = contractImplementations(
  (options: NonNullable<Options>) => ({
    items: createMockEventItemsRepository(options),
    schedule: createMockScheduleRepository(options),
  }),
  (http: HttpClient) => ({
    items: createHttpEventItemsRepository(http),
    schedule: createHttpScheduleRepository(http),
  }),
)

const BRUNO = 'bruno.reis@example.com'
const LU = 'lu.andrade@example.com'
const ANA = 'ana.prado@example.com'
const ADMIN = 'admin@local.test'
/** Saída Manaus: 20 to 22 Nov 2026, in Manaus' timezone. */
const MANAUS = 3
const MANAUS_TZ = 'America/Manaus'

describe.each(implementations)('ScheduleRepository contract (%s)', (_, createRepository) => {
  it('gives the General info: the items with no date, in creation order', async () => {
    const { schedule } = createRepository(BRUNO)

    const { generalInfo } = await schedule.get(MANAUS)

    expect(generalInfo).toEqual([
      { id: 1, name: 'O que levar', when: null, place: null, state: 'PUBLISHED' },
      { id: 12, name: 'Contatos', when: null, place: null, state: 'PUBLISHED' },
    ])
  })

  it('gives only the days with items, in date order, the eve outside the period included', async () => {
    const { schedule } = createRepository(BRUNO)

    const { timeline } = await schedule.get(MANAUS)

    expect(timeline.map((day) => day.date)).toEqual([
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
    ])
  })

  it('puts the untimed first in a day, then by time; the 00:40 transfer on Sunday', async () => {
    const { schedule } = createRepository(BRUNO)

    const { timeline } = await schedule.get(MANAUS)
    const day = (date: string) => timeline.find((d) => d.date === date)!.items.map((i) => i.name)

    expect(day('2026-11-21')).toEqual(['Almoço', 'Passagem de som', 'Show'])
    expect(day('2026-11-22')).toEqual(['Translado de volta', 'Check-out', 'Voo MAO → VIX'])
  })

  it("sends the time as { date, time, timezone }: the place's zone, or else the Event's", async () => {
    const { schedule } = createRepository(BRUNO)

    const { timeline } = await schedule.get(MANAUS)
    const items = timeline.flatMap((d) => d.items)
    const named = (name: string) => items.find((i) => i.name === name)

    expect(named('Saída da sede')).toEqual({
      id: 2,
      name: 'Saída da sede',
      when: { date: '2026-11-20', time: '05:30', timezone: 'America/Sao_Paulo' },
      place: { name: 'Vitória', address: null, timezone: 'America/Sao_Paulo' },
      state: 'PUBLISHED',
    })
    expect(named('Show')?.when).toEqual({ date: '2026-11-21', time: '19:00', timezone: MANAUS_TZ })
    expect(named('Almoço')?.when).toEqual({ date: '2026-11-21', time: null, timezone: MANAUS_TZ })
  })

  it('lets the Super admin read it', async () => {
    const { schedule } = createRepository(ADMIN)

    await expect(schedule.get(MANAUS)).resolves.toMatchObject({ generalInfo: expect.any(Array) })
  })

  it('refuses a Viewer with FORBIDDEN, for now, and someone outside the Group with NOT_FOUND', async () => {
    await expect(createRepository(LU).schedule.get(MANAUS)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(createRepository(ANA).schedule.get(MANAUS)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('refuses with UNAUTHENTICATED when signed out', async () => {
    await expect(createRepository(null).schedule.get(MANAUS)).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
  })
})

describe.each(implementations)('EventItemsRepository contract (%s)', (_, createRepository) => {
  it('creates an item with date, time and a place in another timezone, born published', async () => {
    const { items } = createRepository(BRUNO)

    const created = await items.create(MANAUS, {
      name: '  Ensaio no hotel ',
      date: '2026-11-21',
      time: '11:00',
      place: { name: 'Hotel Taj Mahal', address: null, timezone: null },
    })

    expect(created).toEqual({
      id: expect.any(Number),
      name: 'Ensaio no hotel',
      when: { date: '2026-11-21', time: '11:00', timezone: MANAUS_TZ },
      place: { name: 'Hotel Taj Mahal', address: null, timezone: null },
      state: 'PUBLISHED',
    })
  })

  it('shows the new item in the schedule, in its day by time', async () => {
    const { items, schedule } = createRepository(BRUNO)
    await items.create(MANAUS, { name: 'Ensaio no hotel', date: '2026-11-21', time: '11:00' })

    const { timeline } = await schedule.get(MANAUS)

    expect(timeline.find((d) => d.date === '2026-11-21')!.items.map((i) => i.name)).toEqual([
      'Almoço',
      'Ensaio no hotel',
      'Passagem de som',
      'Show',
    ])
  })

  it('creates an item with no date in the General info', async () => {
    const { items, schedule } = createRepository(BRUNO)

    const created = await items.create(MANAUS, { name: 'Voltagem: 127 V' })

    expect(created).toMatchObject({ when: null, place: null })
    const { generalInfo } = await schedule.get(MANAUS)
    expect(generalInfo.at(-1)).toMatchObject({ name: 'Voltagem: 127 V' })
  })

  it('refuses a time with no date with EVENT_ITEM_TIME_WITHOUT_DATE', async () => {
    const { items } = createRepository(BRUNO)

    await expect(items.create(MANAUS, { name: 'Ensaio', time: '11:00' })).rejects.toMatchObject({
      code: 'EVENT_ITEM_TIME_WITHOUT_DATE',
    })
  })

  it.each([
    ['a blank name', { name: '  ' }, 'name'],
    ['a time that does not exist', { name: 'Ensaio', date: '2026-11-21', time: '24:00' }, 'time'],
    [
      'an unknown timezone',
      { name: 'Ensaio', place: { name: null, address: null, timezone: 'Mars/Olympus' } },
      'place.timezone',
    ],
    ['an empty place', { name: 'Ensaio', place: { name: ' ', address: null } }, 'place'],
  ])('refuses %s with VALIDATION_ERROR naming the field', async (_, input, path) => {
    const { items } = createRepository(BRUNO)

    await expect(items.create(MANAUS, input)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path })],
    })
  })

  it('edits only what it is given; null clears the time, and the place goes whole', async () => {
    const { items } = createRepository(BRUNO)

    const edited = await items.update(MANAUS, 6, {
      time: null,
      place: { name: 'Teatro Amazonas', address: null, timezone: 'America/Sao_Paulo' },
    })

    expect(edited).toEqual({
      id: 6,
      name: 'Passagem de som',
      when: { date: '2026-11-21', time: null, timezone: 'America/Sao_Paulo' },
      place: { name: 'Teatro Amazonas', address: null, timezone: 'America/Sao_Paulo' },
      state: 'PUBLISHED',
    })
  })

  it('refuses clearing the date of a timed item with EVENT_ITEM_TIME_WITHOUT_DATE', async () => {
    const { items } = createRepository(BRUNO)

    await expect(items.update(MANAUS, 6, { date: null })).rejects.toMatchObject({
      code: 'EVENT_ITEM_TIME_WITHOUT_DATE',
    })
    await expect(items.update(MANAUS, 6, { date: null, time: null })).resolves.toMatchObject({
      when: null,
    })
  })

  it('deletes an item, gone from the schedule', async () => {
    const { items, schedule } = createRepository(BRUNO)

    await items.remove(MANAUS, 11)

    const { timeline } = await schedule.get(MANAUS)
    expect(timeline.map((d) => d.date)).not.toContain('2026-11-19')
  })

  it('answers NOT_FOUND for an item of another Event, or none', async () => {
    const { items } = createRepository(BRUNO)

    await expect(items.update(1, 6, { name: 'X' })).rejects.toMatchObject({ code: 'NOT_FOUND' })
    await expect(items.remove(MANAUS, 99)).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('refuses a Viewer with FORBIDDEN, and someone outside the Group with NOT_FOUND', async () => {
    await expect(createRepository(LU).items.create(MANAUS, { name: 'X' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(createRepository(LU).items.remove(MANAUS, 6)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(
      createRepository(ANA).items.update(MANAUS, 6, { name: 'X' }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })

  it('refuses with UNAUTHENTICATED when signed out', async () => {
    const { items } = createRepository(null)

    await expect(items.create(MANAUS, { name: 'X' })).rejects.toMatchObject({
      code: 'UNAUTHENTICATED',
    })
  })
})
