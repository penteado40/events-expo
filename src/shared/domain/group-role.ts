/**
 * What a person is in a Group: Owner or Viewer (a Group member), or the Super admin, who is never
 * a Group member but sees every Group. The app only hides actions with it; the API decides.
 */
export type GroupRole = 'OWNER' | 'VIEWER' | 'SUPER_ADMIN'

export const GROUP_ROLE_LABELS: Record<GroupRole, string> = {
  OWNER: 'Owner',
  VIEWER: 'Viewer',
  SUPER_ADMIN: 'Super admin',
}

/** Owners and the Super admin see what is in Draft; Viewers only see where and when. */
export const seesDrafts = (role: GroupRole) => role !== 'VIEWER'

/** Only a Group member can be a Participant, and so be told "você não vai". */
export const isGroupMember = (role: GroupRole) => role !== 'SUPER_ADMIN'
