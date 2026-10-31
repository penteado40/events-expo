import { z } from 'zod'

import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import { useSession } from '@/shared/session'

import { eventSchema, type EventsRepository } from './repository'

type Options = {
  /** Who is asking: the Session's User, as the API's AuthVerifier would know them. */
  getEmail?: () => Promise<string | null>
  backend?: MockBackend
}

const sessionEmail = async () => useSession.getState().session?.user.email ?? null

/** EventsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockEventsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): EventsRepository {
  const identity = async () => {
    const email = await getEmail()
    return email === null ? null : { email }
  }
  return {
    listByGroup: async (groupId) =>
      z.array(eventSchema).parse(await backend.groupEvents(await identity(), groupId)),
  }
}
