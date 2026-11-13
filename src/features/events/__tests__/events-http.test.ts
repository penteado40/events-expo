import { createHttpClient } from '@/shared/lib/http'

import { createHttpEventsRepository } from '../api'

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

function repositoryAnswering(body: unknown) {
  const fetch = jest.fn(
    async () =>
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
  )
  return createHttpEventsRepository(
    createHttpClient({ baseUrl: 'https://api.test', getToken: async () => 'token', fetch }),
  )
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
