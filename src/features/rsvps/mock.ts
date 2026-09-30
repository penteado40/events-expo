import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import type { User } from '@/shared/session'

import type { RsvpsRepository } from './repository'
import { rsvpListSchema } from './schemas'

type Options = {
  /** The Session's User: the mock trusts it, since a Live session's token means nothing here. */
  getRequester: () => User | null
  backend?: MockBackend
}

/** RsvpsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockRsvpsRepository({
  getRequester,
  backend = mockBackend,
}: Options): RsvpsRepository {
  return {
    list: async (eventId) => rsvpListSchema.parse(await backend.listRsvps(getRequester(), eventId)),
  }
}
