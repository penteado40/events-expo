import { createHttpClient } from '@/shared/lib/http'

import {
  createHttpEventItemsRepository,
  createHttpEventsRepository,
  createHttpParticipantsRepository,
  createHttpScheduleRepository,
  type Audience,
  type ItemFieldInput,
} from '../api'

/** An Event exactly as the events-api answers it today (PROJ-182). */
const API_EVENT = {
  id: 7,
  groupId: 1,
  name: 'Shows em Manaus',
  place: 'Manaus - AM',
  period: { startDate: '2026-11-13', endDate: '2026-11-16', timezone: 'America/Manaus' },
  state: 'DRAFT',
  isFinished: false,
  createdAt: '2026-11-12T22:00:00.000Z',
  updatedAt: '2026-11-12T22:00:00.000Z',
}

function clientAnswering(body: unknown, status = 200) {
  const fetch = jest.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  const http = createHttpClient({
    baseUrl: 'https://api.test',
    getToken: async () => 'token',
    fetch: fetch as unknown as typeof globalThis.fetch,
  })
  return { http, fetch }
}

function repositoryAnswering(body: unknown) {
  return createHttpEventsRepository(clientAnswering(body).http)
}

describe('HTTP EventsRepository over the events-api as it is', () => {
  it('reads an Event without Participants or cancelling: not Cancelled, Participant unknown', async () => {
    const repo = repositoryAnswering({ data: [API_EVENT] })

    await expect(repo.listByGroup(1)).resolves.toEqual([
      {
        id: 7,
        groupId: 1,
        name: 'Shows em Manaus',
        place: 'Manaus - AM',
        period: { startDate: '2026-11-13', endDate: '2026-11-16', timezone: 'America/Manaus' },
        state: 'DRAFT',
        cancelled: false,
        isParticipant: null,
      },
    ])
  })

  it('reads a Cancelled Event, sent as `state: CANCELLED`, as a Cancelled published one', async () => {
    const repo = repositoryAnswering({ data: [{ ...API_EVENT, state: 'CANCELLED' }] })

    await expect(repo.listByGroup(1)).resolves.toMatchObject([
      { state: 'PUBLISHED', cancelled: true },
    ])
  })

  it('reads whether the requester goes from the Event’s membership, unknown for the Super admin', async () => {
    const going = repositoryAnswering({
      data: { ...API_EVENT, membership: { isParticipant: true } },
    })
    const admin = repositoryAnswering({ data: { ...API_EVENT, membership: null } })

    await expect(going.get(7)).resolves.toMatchObject({ isParticipant: true })
    await expect(admin.get(7)).resolves.toMatchObject({ isParticipant: null })
  })

  it('keeps what the API says once it sends it', async () => {
    const repo = repositoryAnswering({
      data: { ...API_EVENT, cancelled: true, isParticipant: true },
    })

    await expect(repo.get(7)).resolves.toMatchObject({ cancelled: true, isParticipant: true })
  })
})

/** An Event item exactly as the events-api answers a write (PROJ-187). */
const API_ITEM = {
  id: 9,
  eventId: 7,
  name: 'Passagem de som',
  when: { date: '2026-11-14', time: '15:00', timezone: 'America/Manaus' },
  place: { name: 'Teatro Amazonas', address: null, timezone: null },
  state: 'PUBLISHED',
  createdAt: '2026-11-12T22:00:00.000Z',
  updatedAt: '2026-11-12T22:00:00.000Z',
}

describe('HTTP items and schedule over the events-api as it is', () => {
  it('reads the schedule with the time as { date, time, timezone }, no Fields before PROJ-198 and no authorship yet', async () => {
    const { eventId: _, createdAt: __, updatedAt: ___, ...scheduled } = API_ITEM
    const { http, fetch } = clientAnswering({
      data: { generalInfo: [], timeline: [{ date: '2026-11-14', items: [scheduled] }] },
    })

    await expect(createHttpScheduleRepository(http).get(7)).resolves.toEqual({
      generalInfo: [],
      timeline: [
        {
          date: '2026-11-14',
          items: [
            {
              ...scheduled,
              fields: [],
              audience: { kind: 'ALL' },
              updatedAt: null,
              updatedBy: null,
            },
          ],
        },
      ],
    })
    expect(fetch.mock.calls[0][0]).toBe('https://api.test/events/7/schedule')
  })

  it('creates an item with the body the API takes, dropping what the app does not use', async () => {
    const { http, fetch } = clientAnswering({ data: API_ITEM }, 201)
    const input = { name: 'Passagem de som', date: '2026-11-14', time: '15:00', place: null }

    const created = await createHttpEventItemsRepository(http).create(7, input)

    expect(created).toEqual({
      id: 9,
      name: 'Passagem de som',
      when: { date: '2026-11-14', time: '15:00', timezone: 'America/Manaus' },
      place: { name: 'Teatro Amazonas', address: null, timezone: null },
      state: 'PUBLISHED',
      fields: [],
      audience: { kind: 'ALL' },
      // A write says when, not yet by whom (ADR-0013).
      updatedAt: '2026-11-12T22:00:00.000Z',
      updatedBy: null,
    })
    expect(fetch.mock.calls[0][0]).toBe('https://api.test/events/7/items')
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual(input)
  })

  it("throws the API's 400 for a time with no date", async () => {
    const { http } = clientAnswering(
      {
        error: {
          code: 'EVENT_ITEM_TIME_WITHOUT_DATE',
          message: 'O Event item só pode ter hora se tiver data.',
        },
      },
      400,
    )

    await expect(
      createHttpEventItemsRepository(http).update(7, 9, { date: null }),
    ).rejects.toMatchObject({ code: 'EVENT_ITEM_TIME_WITHOUT_DATE' })
  })

  it('reads the schedule with the Fields as the events-api sends them: kind and value, no Highlight', async () => {
    const repo = createHttpScheduleRepository(
      clientAnswering({
        data: {
          generalInfo: [
            {
              id: 1,
              name: 'O que levar',
              when: null,
              place: null,
              state: 'PUBLISHED',
              fields: [{ id: 2, kind: 'TEXT', name: 'Lista', value: 'Documento com foto' }],
            },
          ],
          timeline: [
            {
              date: '2026-11-17',
              items: [
                {
                  id: 3,
                  name: 'Ida pra Santos',
                  when: { date: '2026-11-17', time: '05:00', timezone: 'America/Sao_Paulo' },
                  place: null,
                  state: 'PUBLISHED',
                  fields: [
                    {
                      id: 4,
                      kind: 'PEOPLE',
                      name: 'Carro Pedro',
                      value: [
                        { userId: 3, name: 'Matias Costa' },
                        { name: 'Drika (só até Campinas)' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      }).http,
    )

    const schedule = await repo.get(7)

    expect(schedule.generalInfo[0].fields).toEqual([
      { id: 2, type: 'TEXT', name: 'Lista', value: 'Documento com foto', highlight: false },
    ])
    expect(schedule.timeline[0].items[0].fields).toEqual([
      {
        id: 4,
        type: 'PEOPLE',
        name: 'Carro Pedro',
        highlight: false,
        personalNotesVisibility: 'PRIVATE',
        people: [
          { userId: 3, name: 'Matias Costa', personalNote: null, outOfEvent: false },
          { userId: null, name: 'Drika (só até Campinas)', personalNote: null, outOfEvent: false },
        ],
      },
    ])
  })

  it('writes a text Field in the body the API takes, leaving out the Highlight', async () => {
    const answer = {
      id: 4,
      kind: 'TEXT',
      name: 'Obs',
      value: 'Despachar o som',
      eventItemId: 9,
      createdAt: '2026-11-12T22:00:00.000Z',
      updatedAt: '2026-11-12T22:00:00.000Z',
    }
    const { http, fetch } = clientAnswering({ data: answer }, 201)
    const items = createHttpEventItemsRepository(http)

    await expect(
      items.addField(7, 9, {
        type: 'TEXT',
        name: 'Obs',
        value: 'Despachar o som',
        highlight: true,
      }),
    ).resolves.toEqual({
      id: 4,
      type: 'TEXT',
      name: 'Obs',
      value: 'Despachar o som',
      highlight: false,
    })
    await items.updateField(7, 9, 4, { value: 'Às 13h', highlight: false })
    await items.orderFields(7, 9, [4, 3])

    expect(
      fetch.mock.calls.map(([url, init]) => [init?.method, url, JSON.parse(String(init?.body))]),
    ).toEqual([
      [
        'POST',
        'https://api.test/events/7/items/9/fields',
        { kind: 'TEXT', name: 'Obs', value: 'Despachar o som' },
      ],
      ['PATCH', 'https://api.test/events/7/items/9/fields/4', { value: 'Às 13h' }],
      ['PUT', 'https://api.test/events/7/items/9/fields/order', { fieldIds: [4, 3] }],
    ])
  })

  it('writes a Field of people as `{ userId }` and `{ name }`, leaving out notes and who sees them', async () => {
    const answer = {
      id: 5,
      kind: 'PEOPLE',
      name: 'Carro 1 - EC',
      value: [{ userId: 3, name: 'Matias Costa' }, { name: 'Seu Raimundo' }],
      eventItemId: 9,
      createdAt: '2026-11-12T22:00:00.000Z',
      updatedAt: '2026-11-12T22:00:00.000Z',
    }
    const { http, fetch } = clientAnswering({ data: answer }, 201)
    const items = createHttpEventItemsRepository(http)
    const input = {
      type: 'PEOPLE',
      name: 'Carro 1 - EC',
      highlight: true,
      personalNotesVisibility: 'ALL',
      people: [
        { userId: 3, personalNote: 'dirigindo' },
        { name: 'Seu Raimundo', personalNote: null },
      ],
    } satisfies ItemFieldInput

    await expect(items.addField(7, 9, input)).resolves.toMatchObject({
      type: 'PEOPLE',
      people: [
        { userId: 3, name: 'Matias Costa' },
        { userId: null, name: 'Seu Raimundo' },
      ],
    })
    await items.updateField(7, 9, 5, { people: [{ userId: 3 }] })

    expect(
      fetch.mock.calls.map(([url, init]) => [init?.method, url, JSON.parse(String(init?.body))]),
    ).toEqual([
      [
        'POST',
        'https://api.test/events/7/items/9/fields',
        {
          kind: 'PEOPLE',
          name: 'Carro 1 - EC',
          people: [{ userId: 3 }, { name: 'Seu Raimundo' }],
        },
      ],
      ['PATCH', 'https://api.test/events/7/items/9/fields/5', { people: [{ userId: 3 }] }],
    ])
  })

  it('offers Fields of people, but no Highlight nor Personal notes until the events-api has them', () => {
    const items = createHttpEventItemsRepository(clientAnswering({ data: null }).http)

    expect(items.peopleFieldsAvailable()).toBe(true)
    expect(items.highlightAvailable()).toBe(false)
    expect(items.personalNotesAvailable()).toBe(false)
  })

  it('writes a chosen Audience in the item’s PATCH and reads it back as people', async () => {
    const audience: Audience = { kind: 'SELECTED', userIds: [3, 5] }
    const { http, fetch } = clientAnswering({ data: { ...API_ITEM, audience } })

    const edited = await createHttpEventItemsRepository(http).update(7, 9, { audience })

    expect(edited.audience).toEqual(audience)
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH')
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ audience })
  })

  it('creates an item with a chosen Audience in the body', async () => {
    const audience: Audience = { kind: 'SELECTED', userIds: [5] }
    const { http, fetch } = clientAnswering({ data: { ...API_ITEM, audience } }, 201)
    const input = { name: 'Ensaio no hotel', audience }

    const created = await createHttpEventItemsRepository(http).create(7, input)

    expect(created.audience).toEqual(audience)
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual(input)
  })

  it("throws the API's 409 for someone chosen who is not going", async () => {
    const { http } = clientAnswering(
      { error: { code: 'NOT_A_PARTICIPANT', message: 'Só Participants do Event.' } },
      409,
    )

    await expect(
      createHttpEventItemsRepository(http).update(7, 9, {
        audience: { kind: 'SELECTED', userIds: [9] },
      }),
    ).rejects.toMatchObject({ code: 'NOT_A_PARTICIPANT' })
  })

  it('offers no choice of Audience until the events-api has it', () => {
    const { http } = clientAnswering({ data: null })

    expect(createHttpEventItemsRepository(http).audienceAvailable()).toBe(false)
  })

  it('publishes, cancels and uncancels an item on its own routes, with no body', async () => {
    const { http, fetch } = clientAnswering({ data: { ...API_ITEM, state: 'CANCELLED' } })
    const items = createHttpEventItemsRepository(http)

    await expect(items.cancel(7, 9)).resolves.toMatchObject({ id: 9, state: 'CANCELLED' })
    await items.publish(7, 9)
    await items.uncancel(7, 9)

    expect(fetch.mock.calls.map(([url, init]) => [init?.method, url, init?.body])).toEqual([
      ['POST', 'https://api.test/events/7/items/9/cancel', undefined],
      ['POST', 'https://api.test/events/7/items/9/publish', undefined],
      ['POST', 'https://api.test/events/7/items/9/uncancel', undefined],
    ])
  })

  it("throws the API's 409 for cancelling an item in Draft", async () => {
    const error = {
      code: 'EVENT_ITEM_NOT_PUBLISHED',
      message: 'Só um Event item publicado pode ser cancelado; um em Draft é apagado.',
    }
    const { http } = clientAnswering({ error }, 409)

    await expect(createHttpEventItemsRepository(http).cancel(7, 9)).rejects.toMatchObject({
      code: 'EVENT_ITEM_NOT_PUBLISHED',
    })
  })
})

describe('HTTP Participants over the events-api as it is', () => {
  it('lists Participants, with no role for someone no longer a Group member', async () => {
    const { http } = clientAnswering({
      data: [
        { userId: 3, name: 'Matias Costa', phone: '+5592999990002', role: 'VIEWER' },
        { userId: 8, name: 'Ex-membro', phone: '+5592999990008', role: null },
      ],
    })
    const participants = createHttpParticipantsRepository(http)

    expect(participants.available()).toBe(true)
    await expect(participants.list(7)).resolves.toEqual([
      { userId: 3, name: 'Matias Costa', phone: '+5592999990002', role: 'VIEWER' },
      { userId: 8, name: 'Ex-membro', phone: '+5592999990008', role: null },
    ])
  })
})
