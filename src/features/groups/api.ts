import { z } from 'zod'

import { apiClient } from '@/shared/lib/api-client'
import type { HttpClient } from '@/shared/lib/http'
import { selectRepository } from '@/shared/lib/select-repository'

import { createMockGroupsRepository } from './mock'
import type { GroupsRepository } from './repository'
import {
  activationLinkSchema,
  addedViewerSchema,
  groupMemberSchema,
  groupSchema,
  teamSchema,
} from './schemas'

export type { GroupsRepository, NewViewer } from './repository'
export type { ActivationLink, AddedViewer, Group, GroupMember, Team } from './schemas'

export function createHttpGroupsRepository(http: HttpClient): GroupsRepository {
  return {
    list: () => http.get('/groups', { schema: z.array(groupSchema) }),
    listMembers: (groupId) =>
      http.get(`/groups/${groupId}/members`, { schema: z.array(groupMemberSchema) }),
    listTeams: (groupId) => http.get(`/groups/${groupId}/teams`, { schema: z.array(teamSchema) }),
    addViewer: (groupId, person) =>
      http.post(`/groups/${groupId}/viewers`, { body: person, schema: addedViewerSchema }),
    reissueActivationLink: (groupId, userId) =>
      http.post(`/groups/${groupId}/members/${userId}/activation-link`, {
        schema: activationLinkSchema,
      }),
    removeViewer: (groupId, userId) => http.send('DELETE', `/groups/${groupId}/viewers/${userId}`),
    createTeam: (groupId, name) =>
      http.post(`/groups/${groupId}/teams`, { body: { name }, schema: teamSchema }),
    renameTeam: (groupId, teamId, name) =>
      http.patch(`/groups/${groupId}/teams/${teamId}`, { body: { name }, schema: teamSchema }),
    deleteTeam: (groupId, teamId) => http.send('DELETE', `/groups/${groupId}/teams/${teamId}`),
    // PROJ-183 is not built in the events-api yet: the two routes below answer 404 there.
    editsTeamMembers: () => false,
    addTeamMember: (groupId, teamId, userId) =>
      http.send('PUT', `/groups/${groupId}/teams/${teamId}/members/${userId}`),
    removeTeamMember: (groupId, teamId, userId) =>
      http.send('DELETE', `/groups/${groupId}/teams/${teamId}/members/${userId}`),
  }
}

/** The feature's only door to its data. */
export const groupsRepository = selectRepository<GroupsRepository>('groups', {
  http: createHttpGroupsRepository(apiClient),
  mock: createMockGroupsRepository(),
})
