import { mockBackend, type MockBackend } from '@/shared/mock-backend'

import type { EventsRepository } from './repository'
import { eventListSchema, eventSchema } from './schemas'

type Options = {
  getToken: () => string | null
  backend?: MockBackend
}

/** EventsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockEventsRepository({
  getToken,
  backend = mockBackend,
}: Options): EventsRepository {
  return {
    list: async () => eventListSchema.parse(await backend.listEvents(getToken())),
    get: async (id) => eventSchema.parse(await backend.getEvent(getToken(), id)),
  }
}
