import { z } from 'zod'

import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'

import type { EventsRepository } from './repository'
import { eventSchema } from './schemas'

type Options = { getEmail?: GetEmail; backend?: MockBackend }

/** EventsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockEventsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): EventsRepository {
  return {
    listByGroup: async (groupId) =>
      z.array(eventSchema).parse(await backend.groupEvents(await identityOf(getEmail), groupId)),
  }
}
