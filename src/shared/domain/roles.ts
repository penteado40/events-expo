import { z } from 'zod'

import type { User } from '@/shared/session'

export const EVENT_ROLES = ['OWNER', 'MANAGER', 'VIEWER'] as const

export type EventRole = (typeof EVENT_ROLES)[number]

/** The requester's Event member entry, as the API sends it with each Event. */
export const membershipSchema = z.object({ role: z.enum(EVENT_ROLES), isPrimaryOwner: z.boolean() })

export type Membership = z.infer<typeof membershipSchema>

const SUPER_ADMIN = 'Super admin'

const EVENT_ROLE_LABELS: Record<EventRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
}

export const isSuperAdmin = (user: Pick<User, 'role'>) => user.role === 'SUPER_ADMIN'

/**
 * Who the viewer is in an Event: their role, with "· principal" for the Primary owner. No
 * Membership means the Super admin, who is never an Event member (the API sends null).
 */
export function roleLabel(membership: Membership | null): string {
  if (!membership) return SUPER_ADMIN
  const label = EVENT_ROLE_LABELS[membership.role]
  return membership.isPrimaryOwner ? `${label} · principal` : label
}

/** A User's platform role, when they have one: only the Super admin does. */
export const platformRoleLabel = (role: User['role']): string | null =>
  isSuperAdmin({ role }) ? SUPER_ADMIN : null
