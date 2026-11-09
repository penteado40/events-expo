import { z } from 'zod'

import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'

import type { GroupsRepository } from './repository'
import { groupMemberSchema, groupSchema, teamSchema } from './schemas'

type Options = { getEmail?: GetEmail; backend?: MockBackend }

/** GroupsRepository over the shared mock backend (ADR-0002), answers validated like HTTP's. */
export function createMockGroupsRepository({
  getEmail = sessionEmail,
  backend = mockBackend,
}: Options = {}): GroupsRepository {
  return {
    list: async () => z.array(groupSchema).parse(await backend.groups(await identityOf(getEmail))),
    listMembers: async (groupId) =>
      z
        .array(groupMemberSchema)
        .parse(await backend.groupMembers(await identityOf(getEmail), groupId)),
    listTeams: async (groupId) =>
      z.array(teamSchema).parse(await backend.groupTeams(await identityOf(getEmail), groupId)),
  }
}
