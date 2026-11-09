import type { Group, GroupMember, Team } from './schemas'

/** Mirrors the events-api's `groups` module; this slice only reads. */
export interface GroupsRepository {
  /** The Groups the User is a Group member of (every Group for the Super admin), by name. */
  list(): Promise<Group[]>
  /** Who is in the Group. `NOT_FOUND` for anyone outside it. */
  listMembers(groupId: number): Promise<GroupMember[]>
  /** The Group's Teams by name. `NOT_FOUND` for anyone outside it. */
  listTeams(groupId: number): Promise<Team[]>
}
