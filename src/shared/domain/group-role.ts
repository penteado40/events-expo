import type { User } from '@/shared/session'

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

/**
 * The person's role in a Group, from the User's Membership. A Group it does not know yet (added
 * since the last `GET /me`) counts as Viewer, the least: the API decides anyway.
 */
export function roleIn(user: User, groupId: number): GroupRole {
  if (user.isSuperAdmin) return 'SUPER_ADMIN'
  return user.memberships.find((m) => m.groupId === groupId)?.role ?? 'VIEWER'
}

/** Owners and the Super admin create Events in a Group. */
export const canCreateEvent = (role: GroupRole) => role !== 'VIEWER'

/**
 * Owners and the Super admin edit an Event's name, place and dates, a Finished event too; a
 * Cancelled one stays frozen until it is un-cancelled.
 */
export const canEditEvent = (role: GroupRole, event: { cancelled: boolean }) =>
  role !== 'VIEWER' && !event.cancelled

/**
 * Who edits the Event writes its items, in Draft or published (where an item is born in Draft,
 * with "RASCUNHO" and Publicar); a Cancelled Event's stay frozen until it is un-cancelled.
 */
export const canWriteItems = (role: GroupRole, event: { cancelled: boolean }) =>
  canEditEvent(role, event)

/** An Event item's state (events-api PROJ-194, PROJ-195). */
export type ItemState = 'DRAFT' | 'PUBLISHED' | 'CANCELLED'

/** What the item's actions offer, by its state, to who writes the Event's items. */
export type ItemActions = {
  edit: boolean
  publish: boolean
  cancel: boolean
  uncancel: boolean
  delete: boolean
}

/**
 * In Draft, an item is edited, published or deleted; published, edited or cancelled; Cancelled,
 * frozen, only uncancelled. Deleting is for an item in Draft, and for any item of an Event in
 * Draft, which nobody sees yet (there items are born published); a published item the Group sees
 * is cancelled instead, kept visible with its badge. The API also deletes a published item.
 */
export function itemActions(item: ItemState, event: 'DRAFT' | 'PUBLISHED'): ItemActions {
  return {
    edit: item !== 'CANCELLED',
    publish: item === 'DRAFT',
    cancel: item === 'PUBLISHED',
    uncancel: item === 'CANCELLED',
    delete: item === 'DRAFT' || (item === 'PUBLISHED' && event === 'DRAFT'),
  }
}
