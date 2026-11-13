import type { ActivationLink, AddedViewer, Group, GroupMember, Team } from './schemas'

/** Who to add as a Viewer. Name and phone are used only when the email has no User yet. */
export type NewViewer = { name: string; email: string; phone: string }

/** Mirrors the events-api's `groups` module. */
export interface GroupsRepository {
  /** The Groups the User is a Group member of (every Group for the Super admin), by name. */
  list(): Promise<Group[]>
  /** Who is in the Group. `NOT_FOUND` for anyone outside it. */
  listMembers(groupId: number): Promise<GroupMember[]>
  /** The Group's Teams by name. `NOT_FOUND` for anyone outside it. */
  listTeams(groupId: number): Promise<Team[]>
  /**
   * Adds a person as a Viewer by email (PROJ-177): a new email becomes a Pending user and the
   * answer carries their Activation link. `ALREADY_A_GROUP_MEMBER`, `SUPER_ADMIN_NOT_A_GROUP_MEMBER`;
   * `FORBIDDEN` for a Viewer.
   */
  addViewer(groupId: number, person: NewViewer): Promise<AddedViewer>
  /**
   * A new Activation link for a pending Group member (PROJ-180); the previous one stops working.
   * `USER_ALREADY_ACTIVE` for someone who already signed in; `FORBIDDEN` for a Viewer.
   */
  reissueActivationLink(groupId: number, userId: number): Promise<ActivationLink>
  /** Takes a Viewer out of the Group (PROJ-179). `NOT_FOUND` for an Owner; `FORBIDDEN` for a Viewer. */
  removeViewer(groupId: number, userId: number): Promise<void>
  /**
   * Whether `addTeamMember` works here. False over HTTP until the events-api has Team members
   * (PROJ-183): screens then offer no Teams to pick.
   */
  addsTeamMembers(): boolean
  /**
   * Puts a Group member in a Team. PROJ-183 is not built in the events-api yet: this follows its
   * planned route, `PUT /groups/:id/teams/:teamId/members/:userId`, with no body either way.
   */
  addTeamMember(groupId: number, teamId: number, userId: number): Promise<void>
}
