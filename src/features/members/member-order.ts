import type { EventRole } from '@/shared/domain/roles'

import type { EventMember } from './schemas'

const RANK: Record<EventRole, number> = { OWNER: 1, MANAGER: 2, VIEWER: 3 }

const rank = (member: EventMember) => (member.isPrimaryOwner ? 0 : RANK[member.role])

const byName = new Intl.Collator('pt-BR', { sensitivity: 'base' })

/** The Members card's order: Primary owner, Owners, Managers, Viewers; by name within each. */
export const sortMembers = (members: readonly EventMember[]): EventMember[] =>
  [...members].sort((a, b) => rank(a) - rank(b) || byName.compare(a.name, b.name))
