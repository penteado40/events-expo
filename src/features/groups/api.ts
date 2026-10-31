import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import { createMockGroupsRepository } from './mock'
import type { GroupsRepository } from './repository'
import { groupSchema } from './schemas'

export type { GroupsRepository } from './repository'
export type { Group } from './schemas'

export function createHttpGroupsRepository(http: HttpClient): GroupsRepository {
  return { list: () => http.get('/groups', { schema: z.array(groupSchema) }) }
}

/** The feature's only door to its data. */
export const groupsRepository = selectRepository<GroupsRepository>('groups', {
  http: createHttpGroupsRepository(apiClient),
  mock: createMockGroupsRepository(),
})
