import type { HttpClient } from '@/shared/lib/http'
import { contractImplementations } from '@/shared/mock-backend/__tests__/contract'

import {
  createHttpEventItemsRepository,
  createHttpParticipantsRepository,
  createHttpScheduleRepository,
} from '../api'
import {
  createMockEventItemsRepository,
  createMockParticipantsRepository,
  createMockScheduleRepository,
} from '../mock'

type Options = Parameters<typeof createMockEventItemsRepository>[0]

/** Items and schedule over the same backend, so a write shows in the next read. */
const implementations = contractImplementations(
  (options: NonNullable<Options>) => ({
    items: createMockEventItemsRepository(options),
    schedule: createMockScheduleRepository(options),
    participants: createMockParticipantsRepository(options),
  }),
  (http: HttpClient) => ({
    items: createHttpEventItemsRepository(http),
    schedule: createHttpScheduleRepository(http),
    participants: createHttpParticipantsRepository(http),
  }),
)

const BRUNO = 'bruno.reis@example.com'
const LU = 'lu.andrade@example.com'
const ANA = 'ana.prado@example.com'
const ADMIN = 'admin@local.test'
/** Saída Manaus: 20 to 22 Nov 2026, in Manaus' timezone. */
const MANAUS = 3
const MANAUS_TZ = 'America/Manaus'
/** Turnê Minas: in Draft. */
const MINAS = 2
/** Festival de Verão: Cancelled. */
const FESTIVAL = 5
/** "Todos que vão", every item's unless chosen. */
const ALL = { kind: 'ALL' } as const
/** Who wrote the Manaus scenario's items last, and when (ADR-0013; shape assumed). */
const SEEDED = { updatedAt: '2026-10-20T12:00:00.000Z', updatedBy: { id: 2, name: 'Bruno Reis' } }

describe.each(implementations)('ScheduleRepository contract (%s)', (_, createRepository) => {
  it('gives the General info: the items with no date, in creation order', async () => {
    const { schedule } = createRepository(BRUNO)

    const { generalInfo } = await schedule.get(MANAUS)

    expect(generalInfo).toEqual([
      {
        id: 1,
        name: 'O que levar',
        when: null,
        place: null,
        state: 'PUBLISHED',
        fields: [],
        audience: ALL,
        ...SEEDED,
      },
      {
        id: 12,
        name: 'Contatos',
        when: null,
        place: null,
        state: 'PUBLISHED',
        fields: [],
        audience: ALL,
        ...SEEDED,
      },
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
      fields: [],
      audience: ALL,
      ...SEEDED,
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
  it('creates an item with date, time and a place in another timezone, born in Draft in a published Event', async () => {
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
      state: 'DRAFT',
      fields: [],
      audience: ALL,
      updatedAt: expect.any(String),
      updatedBy: { id: 2, name: 'Bruno Reis' },
    })
  })

  it('creates an item born published in an Event in Draft', async () => {
    const { items } = createRepository(BRUNO)

    await expect(items.create(MINAS, { name: 'Passagem de som' })).resolves.toMatchObject({
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
    ['a name of 247 characters', { name: 'x'.repeat(247), date: '2026-11-21' }, 'name'],
    [
      'a place name over 200 characters',
      { name: 'Ensaio', place: { name: 'x'.repeat(201) } },
      'place.name',
    ],
    [
      // The API's DTO measures a place's parts as sent, before trimming them.
      'a place name of 200 characters and a space',
      { name: 'Ensaio', place: { name: `${'x'.repeat(200)} ` } },
      'place.name',
    ],
    [
      'an address over 500 characters',
      { name: 'Ensaio', place: { address: 'x'.repeat(501) } },
      'place.address',
    ],
    ['a time that does not exist', { name: 'Ensaio', date: '2026-11-21', time: '24:00' }, 'time'],
    [
      'an unknown timezone',
      { name: 'Ensaio', place: { name: null, address: null, timezone: 'Mars/Olympus' } },
      'place.timezone',
    ],
  ])('refuses %s with VALIDATION_ERROR naming the field', async (_, input, path) => {
    const { items } = createRepository(BRUNO)

    await expect(items.create(MANAUS, input)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path })],
    })
  })

  it('refuses an edit to a name of 247 characters, leaving the item as it was', async () => {
    const { items, schedule } = createRepository(BRUNO)

    await expect(items.update(MANAUS, 6, { name: 'x'.repeat(247) })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'name' })],
    })
    const { timeline } = await schedule.get(MANAUS)
    expect(timeline.flatMap((d) => d.items).find((i) => i.id === 6)?.name).toBe('Passagem de som')
  })

  it('refuses an empty place with VALIDATION_ERROR, after who may write', async () => {
    const empty = { name: 'Ensaio', place: { name: ' ', address: null } }

    await expect(createRepository(BRUNO).items.create(MANAUS, empty)).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    })
    await expect(createRepository(LU).items.create(MANAUS, empty)).rejects.toMatchObject({
      code: 'FORBIDDEN',
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
      fields: expect.any(Array),
      audience: ALL,
      updatedAt: expect.any(String),
      updatedBy: { id: 2, name: 'Bruno Reis' },
    })
  })

  it('records who wrote the item last and when, shown in the schedule: the Super admin too', async () => {
    const { items, schedule } = createRepository(ADMIN)
    const before = Date.now()

    await items.update(MANAUS, 6, { name: 'Passagem de som e luz' })

    const passagem = (await schedule.get(MANAUS)).timeline
      .flatMap((d) => d.items)
      .find((i) => i.id === 6)!
    expect(passagem.updatedBy).toEqual({ id: 1, name: 'Admin Local' })
    expect(new Date(passagem.updatedAt!).getTime()).toBeGreaterThanOrEqual(before - 1000)
  })

  it('records the Author of a move of the item’s state too', async () => {
    const { items } = createRepository(ADMIN)

    await expect(items.cancel(MANAUS, 6)).resolves.toMatchObject({
      state: 'CANCELLED',
      updatedBy: { id: 1, name: 'Admin Local' },
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

/** Show (Saturday, Teatro Amazonas): published. */
const SHOW = 5

describe.each(implementations)('Event item lifecycle contract (%s)', (_, createRepository) => {
  const stateOf = async (
    schedule: ReturnType<typeof createRepository>['schedule'],
    itemId: number,
  ) => {
    const { generalInfo, timeline } = await schedule.get(MANAUS)
    return [...generalInfo, ...timeline.flatMap((d) => d.items)].find((i) => i.id === itemId)?.state
  }

  it('publishes an item in Draft, and refuses one already published with EVENT_ITEM_NOT_DRAFT', async () => {
    const { items, schedule } = createRepository(BRUNO)
    const draft = await items.create(MANAUS, { name: 'Ensaio no hotel', date: '2026-11-21' })

    await expect(items.publish(MANAUS, draft.id)).resolves.toMatchObject({
      id: draft.id,
      state: 'PUBLISHED',
    })
    expect(await stateOf(schedule, draft.id)).toBe('PUBLISHED')
    await expect(items.publish(MANAUS, draft.id)).rejects.toMatchObject({
      code: 'EVENT_ITEM_NOT_DRAFT',
    })
  })

  it('deletes an item in Draft, gone from the schedule', async () => {
    const { items, schedule } = createRepository(BRUNO)
    const draft = await items.create(MANAUS, { name: 'Ensaio no hotel' })

    await items.remove(MANAUS, draft.id)

    expect(await stateOf(schedule, draft.id)).toBeUndefined()
  })

  it('cancels a published item, kept in the schedule as CANCELLED, and uncancels it back to published', async () => {
    const { items, schedule } = createRepository(BRUNO)

    await expect(items.cancel(MANAUS, SHOW)).resolves.toMatchObject({
      id: SHOW,
      name: 'Show',
      state: 'CANCELLED',
    })
    expect(await stateOf(schedule, SHOW)).toBe('CANCELLED')
    await expect(items.uncancel(MANAUS, SHOW)).resolves.toMatchObject({ state: 'PUBLISHED' })
    expect(await stateOf(schedule, SHOW)).toBe('PUBLISHED')
  })

  it('refuses cancelling an item in Draft with EVENT_ITEM_NOT_PUBLISHED: it is deleted instead', async () => {
    const { items } = createRepository(BRUNO)
    const draft = await items.create(MANAUS, { name: 'Ensaio no hotel' })

    await expect(items.cancel(MANAUS, draft.id)).rejects.toMatchObject({
      code: 'EVENT_ITEM_NOT_PUBLISHED',
    })
  })

  it('freezes a cancelled item: editing, deleting or cancelling it again is EVENT_ITEM_CANCELLED', async () => {
    const { items } = createRepository(BRUNO)
    await items.cancel(MANAUS, SHOW)

    for (const write of [
      () => items.update(MANAUS, SHOW, { name: 'Show de gala' }),
      () => items.remove(MANAUS, SHOW),
      () => items.cancel(MANAUS, SHOW),
      () => items.addField(MANAUS, SHOW, { type: 'TEXT', name: 'Obs', value: 'Figurino' }),
    ]) {
      await expect(write()).rejects.toMatchObject({ code: 'EVENT_ITEM_CANCELLED' })
    }
  })

  it('refuses uncancelling an item that is not cancelled with EVENT_ITEM_NOT_CANCELLED', async () => {
    const { items } = createRepository(BRUNO)

    await expect(items.uncancel(MANAUS, SHOW)).rejects.toMatchObject({
      code: 'EVENT_ITEM_NOT_CANCELLED',
    })
  })

  it('refuses any of it in a Cancelled Event with EVENT_CANCELLED', async () => {
    const { items } = createRepository(BRUNO)

    for (const write of [
      () => items.create(FESTIVAL, { name: 'Show' }),
      () => items.publish(FESTIVAL, SHOW),
      () => items.cancel(FESTIVAL, SHOW),
      () => items.uncancel(FESTIVAL, SHOW),
    ]) {
      await expect(write()).rejects.toMatchObject({ code: 'EVENT_CANCELLED' })
    }
  })

  it('refuses a Viewer with FORBIDDEN, someone outside the Group with NOT_FOUND, and an item of another Event with NOT_FOUND', async () => {
    await expect(createRepository(LU).items.cancel(MANAUS, SHOW)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(createRepository(LU).items.publish(MANAUS, SHOW)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    await expect(createRepository(ANA).items.uncancel(MANAUS, SHOW)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    await expect(createRepository(BRUNO).items.cancel(MINAS, SHOW)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })
})

/** Passagem de som (Saturday, Teatro Amazonas): its Obs and its Contato, in that order. */
const PASSAGEM = 6

describe.each(implementations)('Text Fields contract (%s)', (_, createRepository) => {
  /** The events-api has no Highlight yet (PROJ-200): over HTTP every Field reads `false`. */
  const HIGHLIGHT = createRepository(BRUNO).items.highlightAvailable()

  const fieldsOf = async (
    schedule: ReturnType<typeof createRepository>['schedule'],
    itemId: number,
  ) => {
    const { generalInfo, timeline } = await schedule.get(MANAUS)
    return [...generalInfo, ...timeline.flatMap((d) => d.items)].find((i) => i.id === itemId)!
      .fields
  }

  it('gives each item its text Fields in the production’s order, with their Highlight', async () => {
    const { schedule } = createRepository(BRUNO)

    expect(await fieldsOf(schedule, PASSAGEM)).toEqual([
      { id: 1, type: 'TEXT', name: 'Obs', value: 'Despachar o som às 14h', highlight: false },
      {
        id: 2,
        type: 'TEXT',
        name: 'Contato',
        value: 'Técnico do teatro: (92) 98888-0000',
        highlight: HIGHLIGHT,
      },
    ])
    expect(await fieldsOf(schedule, 7)).toEqual([])
  })

  it('adds a text Field at the end, trimmed, without Highlight unless asked', async () => {
    const { items, schedule } = createRepository(BRUNO)

    const added = await items.addField(MANAUS, PASSAGEM, {
      type: 'TEXT',
      name: ' Voltagem ',
      value: ' 127 V ',
    })
    const highlighted = await items.addField(MANAUS, PASSAGEM, {
      type: 'TEXT',
      name: 'O que levar',
      value: 'In-ear',
      highlight: true,
    })

    expect(added).toEqual({
      id: expect.any(Number),
      type: 'TEXT',
      name: 'Voltagem',
      value: '127 V',
      highlight: false,
    })
    expect(highlighted.highlight).toBe(HIGHLIGHT)
    expect((await fieldsOf(schedule, PASSAGEM)).map((f) => f.name)).toEqual([
      'Obs',
      'Contato',
      'Voltagem',
      'O que levar',
    ])
  })

  it('edits only what it is given, the Highlight too', async () => {
    const { items } = createRepository(BRUNO)

    // Over HTTP there is no Highlight to edit yet: the editor does not offer it.
    if (HIGHLIGHT) {
      expect(await items.updateField(MANAUS, PASSAGEM, 1, { highlight: true })).toEqual({
        id: 1,
        type: 'TEXT',
        name: 'Obs',
        value: 'Despachar o som às 14h',
        highlight: true,
      })
    }
    expect(await items.updateField(MANAUS, PASSAGEM, 1, { value: 'Às 13h' })).toMatchObject({
      name: 'Obs',
      value: 'Às 13h',
      highlight: HIGHLIGHT,
    })
  })

  it('deletes a Field, gone from the item', async () => {
    const { items, schedule } = createRepository(BRUNO)

    await items.removeField(MANAUS, PASSAGEM, 1)

    expect((await fieldsOf(schedule, PASSAGEM)).map((f) => f.id)).toEqual([2])
  })

  it('orders the Fields as given', async () => {
    const { items, schedule } = createRepository(BRUNO)

    await items.orderFields(MANAUS, PASSAGEM, [2, 1])

    expect((await fieldsOf(schedule, PASSAGEM)).map((f) => f.id)).toEqual([2, 1])
  })

  it('refuses an order that is not the item’s Fields, each once, with VALIDATION_ERROR', async () => {
    const { items } = createRepository(BRUNO)

    for (const order of [[1], [1, 1], [1, 2, 99]]) {
      await expect(items.orderFields(MANAUS, PASSAGEM, order)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
      })
    }
  })

  it.each([
    ['a blank name', { type: 'TEXT', name: '  ', value: 'x' }, 'name'],
    ['a name over 100 characters', { type: 'TEXT', name: 'x'.repeat(101), value: '' }, 'name'],
    [
      'a value over 2000 characters',
      { type: 'TEXT', name: 'Obs', value: 'x'.repeat(2001) },
      'value',
    ],
    ['another type', { type: 'PHOTOS', name: 'Paleta', value: '' }, 'type'],
  ] as const)('refuses %s with VALIDATION_ERROR naming it', async (_, input, path) => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.addField(MANAUS, PASSAGEM, input as Parameters<typeof items.addField>[2]),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path })],
    })
  })

  it('answers NOT_FOUND for a Field of another item, or none', async () => {
    const { items } = createRepository(BRUNO)

    await expect(items.updateField(MANAUS, 7, 1, { value: 'x' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
    await expect(items.removeField(MANAUS, PASSAGEM, 99)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    })
  })

  it('refuses a Viewer with FORBIDDEN, and someone signed out with UNAUTHENTICATED', async () => {
    const field = { type: 'TEXT', name: 'Obs', value: 'x' } as const

    await expect(
      createRepository(LU).items.addField(MANAUS, PASSAGEM, field),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(
      createRepository(LU).items.updateField(MANAUS, PASSAGEM, 1, { highlight: true }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' })
    await expect(
      createRepository(null).items.orderFields(MANAUS, PASSAGEM, [2, 1]),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' })
  })
})

describe.each(implementations)('Fields of people contract (%s)', (_, createRepository) => {
  /** Translado de volta, Sunday 00:40, with Carro 1 - EC. */
  const TRANSLADO = 8
  const CARRO_1 = 3
  const MATIAS = 3
  const JACQUE = 4
  const LU_ID = 5
  /** Tiago Souza: in Vocal Livre, but not going to Saída Manaus. */
  const TIAGO = 9
  /**
   * The events-api has no Highlight (PROJ-200), Personal notes (PROJ-204, PROJ-205) nor "fora do
   * Event" yet: over HTTP a Field of people reads only its people, by id and name.
   */
  const HIGHLIGHT = createRepository(BRUNO).items.highlightAvailable()
  const NOTES = createRepository(BRUNO).items.personalNotesAvailable()
  const note = (text: string) => (NOTES ? text : null)
  const visibility = (shown: 'PRIVATE' | 'ALL') => (NOTES ? shown : 'PRIVATE')

  const fieldOf = async (
    schedule: ReturnType<typeof createRepository>['schedule'],
    itemId: number,
    fieldId: number,
  ) => {
    const { generalInfo, timeline } = await schedule.get(MANAUS)
    return [...generalInfo, ...timeline.flatMap((d) => d.items)]
      .find((i) => i.id === itemId)!
      .fields.find((f) => f.id === fieldId)!
  }

  it('gives a Field of people its people in order, with names, Personal notes and the loose name', async () => {
    const { schedule } = createRepository(BRUNO)

    expect(await fieldOf(schedule, TRANSLADO, CARRO_1)).toEqual({
      id: CARRO_1,
      type: 'PEOPLE',
      name: 'Carro 1 - EC',
      highlight: HIGHLIGHT,
      personalNotesVisibility: 'PRIVATE',
      people: [
        {
          userId: MATIAS,
          name: 'Matias Costa',
          personalNote: note('dirigindo'),
          outOfEvent: false,
        },
        { userId: LU_ID, name: 'Lu Andrade', personalNote: null, outOfEvent: false },
        { userId: null, name: 'Seu Raimundo', personalNote: null, outOfEvent: false },
      ],
    })
  })

  it('adds a Field of people with Participants and loose names, trimmed, notes only for each one unless asked', async () => {
    const { items } = createRepository(BRUNO)

    const added = await items.addField(MANAUS, PASSAGEM, {
      type: 'PEOPLE',
      name: ' Quarto 101 ',
      people: [
        { userId: JACQUE, personalNote: ' LOC4X2 ' },
        { name: ' Dona Célia ', personalNote: '  ' },
      ],
    })
    const shown = await items.addField(MANAUS, PASSAGEM, {
      type: 'PEOPLE',
      name: 'Carro 2',
      personalNotesVisibility: 'ALL',
      people: [],
    })

    expect(added).toEqual({
      id: expect.any(Number),
      type: 'PEOPLE',
      name: 'Quarto 101',
      highlight: false,
      personalNotesVisibility: 'PRIVATE',
      people: [
        { userId: JACQUE, name: 'Jacque Moreira', personalNote: note('LOC4X2'), outOfEvent: false },
        { userId: null, name: 'Dona Célia', personalNote: null, outOfEvent: false },
      ],
    })
    expect(shown).toMatchObject({ personalNotesVisibility: visibility('ALL'), people: [] })
  })

  it('edits the people whole and who sees the notes, the rest staying', async () => {
    const { items, schedule } = createRepository(BRUNO)

    await items.updateField(MANAUS, TRANSLADO, CARRO_1, {
      personalNotesVisibility: 'ALL',
      people: [{ name: 'Seu Raimundo', personalNote: 'motorista' }, { userId: JACQUE }],
    })

    expect(await fieldOf(schedule, TRANSLADO, CARRO_1)).toMatchObject({
      name: 'Carro 1 - EC',
      highlight: HIGHLIGHT,
      personalNotesVisibility: visibility('ALL'),
      people: [
        { userId: null, name: 'Seu Raimundo', personalNote: note('motorista') },
        { userId: JACQUE, name: 'Jacque Moreira', personalNote: null },
      ],
    })
  })

  it.each([
    ['a blank loose name', [{ name: '  ' }], 'people.0.name'],
    ['a loose name over 100 characters', [{ name: 'x'.repeat(101) }], 'people.0.name'],
    ['someone twice', [{ userId: 3 }, { userId: 3 }], 'people.1.userId'],
  ] as const)('refuses %s with VALIDATION_ERROR naming it', async (_, people, path) => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.addField(MANAUS, PASSAGEM, { type: 'PEOPLE', name: 'Carro 2', people: [...people] }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path })],
    })
  })

  // Over HTTP the Personal note is not sent at all (the events-api has none yet).
  ;(NOTES ? it : it.skip)(
    'refuses a Personal note over 500 characters with VALIDATION_ERROR naming it',
    async () => {
      const { items } = createRepository(BRUNO)

      await expect(
        items.addField(MANAUS, PASSAGEM, {
          type: 'PEOPLE',
          name: 'Carro 2',
          people: [{ userId: 3, personalNote: 'x'.repeat(501) }],
        }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        details: [expect.objectContaining({ path: 'people.0.personalNote' })],
      })
    },
  )

  it('refuses a value in a Field of people, and people in a text Field, with VALIDATION_ERROR', async () => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.updateField(MANAUS, TRANSLADO, CARRO_1, { value: 'x' } as never),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
    await expect(
      items.updateField(MANAUS, PASSAGEM, 1, { people: [] } as never),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('refuses someone not going with NOT_A_PARTICIPANT', async () => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.addField(MANAUS, PASSAGEM, {
        type: 'PEOPLE',
        name: 'Carro 2',
        people: [{ userId: TIAGO }],
      }),
    ).rejects.toMatchObject({ code: 'NOT_A_PARTICIPANT' })
  })

  // The events-api does not say yet who left the Event, nor take Personal notes.
  ;(NOTES ? it : it.skip)(
    'keeps who left the Event in the Field, marked out of it, until taken out or back',
    async () => {
      const { items, schedule, participants } = createRepository(BRUNO)
      const lu = async () => {
        const field = await fieldOf(schedule, TRANSLADO, CARRO_1)
        return field.type === 'PEOPLE' ? field.people.find((p) => p.userId === LU_ID) : undefined
      }

      await participants.remove(MANAUS, LU_ID)
      expect(await lu()).toMatchObject({ name: 'Lu Andrade', outOfEvent: true })

      // An edit may keep her where she is; it may not put her in another Field.
      await items.updateField(MANAUS, TRANSLADO, CARRO_1, {
        people: [{ userId: LU_ID, personalNote: 'saiu' }, { userId: MATIAS }],
      })
      expect(await lu()).toMatchObject({ personalNote: 'saiu', outOfEvent: true })
      await expect(
        items.addField(MANAUS, PASSAGEM, {
          type: 'PEOPLE',
          name: 'Carro 2',
          people: [{ userId: LU_ID }],
        }),
      ).rejects.toMatchObject({ code: 'NOT_A_PARTICIPANT' })

      await participants.add(MANAUS, LU_ID)
      expect(await lu()).toMatchObject({ outOfEvent: false })
    },
  )
})

describe.each(implementations)('Audience contract (%s)', (_, createRepository) => {
  /** Passagem de som, Saturday at the Teatro Amazonas. */
  const PASSAGEM = 6
  const MATIAS = 3
  const LU_ID = 5
  /** Tiago Souza: in Vocal Livre, but not going to Saída Manaus. */
  const TIAGO = 9

  const audienceOf = async (
    schedule: ReturnType<typeof createRepository>['schedule'],
    itemId: number,
  ) => {
    const { generalInfo, timeline } = await schedule.get(MANAUS)
    return [...generalInfo, ...timeline.flatMap((d) => d.items)].find((i) => i.id === itemId)!
      .audience
  }

  it('gives every item "Todos que vão" unless chosen', async () => {
    const { schedule } = createRepository(BRUNO)

    expect(await audienceOf(schedule, PASSAGEM)).toEqual({ kind: 'ALL' })
  })

  it('chooses a list of Participants, each once, and goes back to "Todos"', async () => {
    const { items, schedule } = createRepository(BRUNO)

    const edited = await items.update(MANAUS, PASSAGEM, {
      audience: { kind: 'SELECTED', userIds: [LU_ID, MATIAS, LU_ID] },
    })
    expect(edited.audience).toEqual({ kind: 'SELECTED', userIds: [MATIAS, LU_ID] })
    expect(await audienceOf(schedule, PASSAGEM)).toEqual({
      kind: 'SELECTED',
      userIds: [MATIAS, LU_ID],
    })

    await items.update(MANAUS, PASSAGEM, { audience: { kind: 'ALL' } })
    expect(await audienceOf(schedule, PASSAGEM)).toEqual({ kind: 'ALL' })
  })

  it('creates an item with a chosen list, and with "Todos" when left out', async () => {
    const { items } = createRepository(BRUNO)

    const chosen = await items.create(MANAUS, {
      name: 'Ensaio no hotel',
      audience: { kind: 'SELECTED', userIds: [LU_ID] },
    })
    const everyone = await items.create(MANAUS, { name: 'Jantar' })

    expect(chosen.audience).toEqual({ kind: 'SELECTED', userIds: [LU_ID] })
    expect(everyone.audience).toEqual({ kind: 'ALL' })
  })

  it('refuses choosing someone not going with NOT_A_PARTICIPANT', async () => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.update(MANAUS, PASSAGEM, { audience: { kind: 'SELECTED', userIds: [TIAGO] } }),
    ).rejects.toMatchObject({ code: 'NOT_A_PARTICIPANT' })
  })

  it('refuses an Audience of another kind, or a list that is not of ids, with VALIDATION_ERROR', async () => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.update(MANAUS, PASSAGEM, { audience: { kind: 'TEAMS' } as never }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'audience.kind' })],
    })
    await expect(
      items.update(MANAUS, PASSAGEM, {
        audience: { kind: 'SELECTED', userIds: ['5'] } as never,
      }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'audience.userIds' })],
    })
  })

  it('refuses a chosen list with nobody in it with VALIDATION_ERROR', async () => {
    const { items } = createRepository(BRUNO)

    await expect(
      items.update(MANAUS, PASSAGEM, { audience: { kind: 'SELECTED', userIds: [] } }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: [expect.objectContaining({ path: 'audience.userIds' })],
    })
  })

  it('takes whoever leaves the Event out of the chosen lists', async () => {
    const { items, schedule, participants } = createRepository(BRUNO)
    await items.update(MANAUS, PASSAGEM, {
      audience: { kind: 'SELECTED', userIds: [MATIAS, LU_ID] },
    })

    await participants.remove(MANAUS, LU_ID)

    expect(await audienceOf(schedule, PASSAGEM)).toEqual({ kind: 'SELECTED', userIds: [MATIAS] })
  })
})
