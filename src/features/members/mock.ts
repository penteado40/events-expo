import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import type { User } from '@/shared/session'

import type { MembersRepository } from './repository'
import { eventMemberListSchema } from './schemas'

type Options = {
  /** The Session's User: the mock trusts it, since a Live session's token means nothing here. */
  getRequester: () => User | null
  backend?: MockBackend
}

/** MembersRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockMembersRepository({
  getRequester,
  backend = mockBackend,
}: Options): MembersRepository {
  return {
    list: async (eventId) =>
      eventMemberListSchema.parse(await backend.listMembers(getRequester(), eventId)),
  }
}
