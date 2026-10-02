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

/** Whether the viewer is the Event's Viewer: read-only, and told so (the Viewer notices). */
export const isViewer = (membership: Membership | null) => membership?.role === 'VIEWER'

/** An Event member's role, with "· principal" for the Primary owner. */
export function memberRoleLabel({ role, isPrimaryOwner }: Membership): string {
  const label = EVENT_ROLE_LABELS[role]
  return isPrimaryOwner ? `${label} · principal` : label
}

/**
 * Who the viewer is in an Event: their member role. No Membership means the Super admin, who is
 * never an Event member (the API sends null).
 */
export const roleLabel = (membership: Membership | null): string =>
  membership ? memberRoleLabel(membership) : SUPER_ADMIN

/** A User's platform role, when they have one: only the Super admin does. */
export const platformRoleLabel = (role: User['role']): string | null =>
  isSuperAdmin({ role }) ? SUPER_ADMIN : null
