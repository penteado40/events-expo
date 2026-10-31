import { z } from 'zod'

import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'

import type { GroupsRepository } from './repository'
import { groupSchema } from './schemas'

type Options = { getEmail?: GetEmail; backend?: MockBackend }

/** GroupsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockGroupsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): GroupsRepository {
  return {
    list: async () => z.array(groupSchema).parse(await backend.groups(await identityOf(getEmail))),
  }
}
