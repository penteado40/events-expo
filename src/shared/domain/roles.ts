import type { User } from '@/shared/session'

export const EVENT_ROLES = ['OWNER', 'MANAGER', 'VIEWER'] as const

export type EventRole = (typeof EVENT_ROLES)[number]

/** The requester's Event member entry, as the API sends it with each Event. */
export type Membership = { role: EventRole; isPrimaryOwner: boolean }

const SUPER_ADMIN = 'Super admin'

const EVENT_ROLE_LABELS: Record<EventRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  VIEWER: 'Viewer',
}

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
  role === 'SUPER_ADMIN' ? SUPER_ADMIN : null
