import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import type { User } from '@/shared/session'

import type { EventsRepository } from './repository'
import { eventListSchema, eventSchema } from './schemas'

type Options = {
  /** The Session's User: the mock trusts it, since a Live session's token means nothing here. */
  getRequester: () => User | null
  backend?: MockBackend
}

/** EventsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockEventsRepository({
  getRequester,
  backend = mockBackend,
}: Options): EventsRepository {
  return {
    list: async () => eventListSchema.parse(await backend.listEvents(getRequester())),
    get: async (id) => eventSchema.parse(await backend.getEvent(getRequester(), id)),
  }
}
