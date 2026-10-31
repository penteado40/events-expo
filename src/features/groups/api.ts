import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import { createMockGroupsRepository } from './mock'
import { groupSchema, type GroupsRepository } from './repository'

export type { Group, GroupsRepository } from './repository'

export function createHttpGroupsRepository(http: HttpClient): GroupsRepository {
  return { list: () => http.get('/groups', { schema: z.array(groupSchema) }) }
}

/** The feature's only door to its data. */
export const groupsRepository = selectRepository<GroupsRepository>('groups', {
  http: createHttpGroupsRepository(apiClient),
  mock: createMockGroupsRepository(),
})
