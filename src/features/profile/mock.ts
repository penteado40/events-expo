import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'
import { userSchema } from '@/shared/session'

import type { ProfileRepository } from './repository'

type Options = { getEmail?: GetEmail; backend?: MockBackend }

/** ProfileRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockProfileRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): ProfileRepository {
  return {
    updateMe: async (changes) =>
      userSchema.parse(await backend.updateMe(await identityOf(getEmail), changes)),
  }
}
