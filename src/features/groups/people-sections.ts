import { foldText } from '@/shared/domain/fold-text'

import type { GroupMember } from './schemas'

export type PeopleSection = { title: string; members: GroupMember[] }

const SECTIONS: { title: string; role: GroupMember['role'] }[] = [
  { title: 'OWNERS · A PRODUÇÃO', role: 'OWNER' },
  { title: 'VIEWERS', role: 'VIEWER' },
]

/** The Pessoas tab: Owners, then Viewers, each by name, filtered by the search on the name. */
export function peopleSections(members: GroupMember[], query: string): PeopleSection[] {
  const search = foldText(query.trim())
  const found = members
    .filter((m) => foldText(m.name).includes(search))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return SECTIONS.map(({ title, role }) => ({
    title,
    members: found.filter((m) => m.role === role),
  })).filter((section) => section.members.length > 0)
}
