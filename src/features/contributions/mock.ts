import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import type { User } from '@/shared/session'

import type { ContributionsRepository } from './repository'
import { contributionListSchema } from './schemas'

type Options = {
  /** The Session's User: the mock trusts it, since a Live session's token means nothing here. */
  getRequester: () => User | null
  backend?: MockBackend
}

/** ContributionsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockContributionsRepository({
  getRequester,
  backend = mockBackend,
}: Options): ContributionsRepository {
  return {
    list: async (eventId) =>
      contributionListSchema.parse(await backend.listContributions(getRequester(), eventId)),
  }
}
