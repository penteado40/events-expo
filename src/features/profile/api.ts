import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { userSchema } from '@/shared/session'

import { createMockProfileRepository } from './mock'
import type { ProfileRepository } from './repository'

export type { ProfileChanges, ProfileRepository } from './repository'

/** `PATCH /me` with Clerk's token. */
export function createHttpProfileRepository(http: HttpClient): ProfileRepository {
  return { updateMe: (changes) => http.patch('/me', { body: changes, schema: userSchema }) }
}

/**
 * The feature's only door to its data. `/me` belongs to the API's `auth` module, live: a Live
 * session edits the real User, Demo mode the sample one.
 */
export const profileRepository = selectRepository<ProfileRepository>('auth', {
  http: createHttpProfileRepository(apiClient),
  mock: createMockProfileRepository(),
})
