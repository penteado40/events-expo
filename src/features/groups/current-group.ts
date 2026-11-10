import { roleIn, type GroupRole } from '@/shared/domain/group-role'
import type { User } from '@/shared/session'

import type { Group } from './schemas'

export type CurrentGroup = Group & { role: GroupRole }

/**
 * The Group the Início shows: the one the person chose on this device while it is still listed,
 * else the first. None when they are in no Group. The role comes from the User's Membership; a
 * Group it does not know yet (added since the last `GET /me`) counts as Viewer, the least: the API
 * decides anyway, and the app only hides actions.
 */
export function resolveCurrentGroup(
  groups: Group[],
  chosenId: number | null,
  user: User,
): CurrentGroup | null {
  const group = groups.find((g) => g.id === chosenId) ?? groups[0]
  if (!group) return null
  return { ...group, role: roleIn(user, group.id) }
}
