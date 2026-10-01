import { mockBackend, type MockBackend } from '@/shared/mock-backend'
import type { User } from '@/shared/session'

import type { RegistryRepository } from './repository'
import { registryItemListSchema } from './schemas'

type Options = {
  /** The Session's User: the mock trusts it, since a Live session's token means nothing here. */
  getRequester: () => User | null
  backend?: MockBackend
}

/** RegistryRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockRegistryRepository({
  getRequester,
  backend = mockBackend,
}: Options): RegistryRepository {
  return {
    list: async (eventId) =>
      registryItemListSchema.parse(await backend.listRegistryItems(getRequester(), eventId)),
  }
}
