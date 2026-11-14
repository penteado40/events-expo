import { z } from 'zod'

import {
  identityOf,
  mockBackend,
  sessionEmail,
  type GetEmail,
  type MockBackend,
} from '@/shared/mock-backend'

import type { GroupsRepository } from './repository'
import {
  activationLinkSchema,
  addedViewerSchema,
  groupMemberSchema,
  groupSchema,
  teamSchema,
} from './schemas'

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
    addViewer: async (groupId, person) =>
      addedViewerSchema.parse(await backend.addViewer(await identityOf(getEmail), groupId, person)),
    reissueActivationLink: async (groupId, userId) =>
      activationLinkSchema.parse(
        await backend.reissueActivationLink(await identityOf(getEmail), groupId, userId),
      ),
    removeViewer: async (groupId, userId) =>
      backend.removeViewer(await identityOf(getEmail), groupId, userId),
    createTeam: async (groupId, name) =>
      teamSchema.parse(await backend.createTeam(await identityOf(getEmail), groupId, { name })),
    renameTeam: async (groupId, teamId, name) =>
      teamSchema.parse(
        await backend.renameTeam(await identityOf(getEmail), groupId, teamId, { name }),
      ),
    deleteTeam: async (groupId, teamId) =>
      backend.deleteTeam(await identityOf(getEmail), groupId, teamId),
    editsTeamMembers: () => true,
    addTeamMember: async (groupId, teamId, userId) =>
      backend.addTeamMember(await identityOf(getEmail), groupId, teamId, userId),
    removeTeamMember: async (groupId, teamId, userId) =>
      backend.removeTeamMember(await identityOf(getEmail), groupId, teamId, userId),
  }
}
