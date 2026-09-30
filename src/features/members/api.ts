import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'
import { useSession } from '@/shared/session'

import { createMockMembersRepository } from './mock'
import type { MembersRepository } from './repository'
import { eventMemberListSchema } from './schemas'

export type { MembersRepository } from './repository'

export function createHttpMembersRepository(http: HttpClient): MembersRepository {
  return {
    list: (eventId) => http.get(`/events/${eventId}/members`, { schema: eventMemberListSchema }),
  }
}

/** The feature's only door to its data. `members` joins LIVE_MODULES with events-api #6. */
export const membersRepository = selectRepository<MembersRepository>('members', {
  http: createHttpMembersRepository(apiClient),
  mock: createMockMembersRepository({
    getRequester: () => useSession.getState().session?.user ?? null,
  }),
})
