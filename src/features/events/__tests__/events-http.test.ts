import { createHttpClient } from '@/shared/lib/http'

import {
  createHttpEventItemsRepository,
  createHttpEventsRepository,
  createHttpScheduleRepository,
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
  it('reads the schedule with the time as { date, time, timezone }', async () => {
    const { eventId: _, createdAt: __, updatedAt: ___, ...scheduled } = API_ITEM
    const { http, fetch } = clientAnswering({
      data: { generalInfo: [], timeline: [{ date: '2026-11-14', items: [scheduled] }] },
    })

    await expect(createHttpScheduleRepository(http).get(7)).resolves.toEqual({
      generalInfo: [],
      timeline: [{ date: '2026-11-14', items: [scheduled] }],
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
})
