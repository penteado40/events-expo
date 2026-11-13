import { foldText } from '@/shared/domain/fold-text'

import type { Person } from './people-and-teams'

export type PeopleSection = { title: string; members: Person[] }

const SECTIONS: { title: string; role: Person['role'] }[] = [
  { title: 'OWNERS · A PRODUÇÃO', role: 'OWNER' },
  { title: 'VIEWERS', role: 'VIEWER' },
]

/** The Pessoas tab: Owners, then Viewers, each by name, filtered by the search on the name. */
export function peopleSections(members: Person[], query: string): PeopleSection[] {
  const search = foldText(query.trim())
  const found = members
    .filter((m) => foldText(m.name).includes(search))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return SECTIONS.map(({ title, role }) => ({
    title,
    members: found.filter((m) => m.role === role),
  })).filter((section) => section.members.length > 0)
}
