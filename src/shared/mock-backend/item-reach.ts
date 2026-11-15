import type { EventItemRow, EventRow } from './data'

/** Who reads: the User, and whether they are the production (who edits the Event). */
export type Reader = { userId: number; production: boolean }

/**
 * Whether an Event item's Audience reaches a reader (events-api glossary, Audience; PROJ-197): the
 * production sees every item. Anyone else must be a Participant: "Todos" reaches every one of
 * them; a chosen list, the chosen and whoever is in a Field of people of the item (someone there
 * who is no longer going does not count).
 */
export function itemReaches(
  item: Pick<EventItemRow, 'audience' | 'fields'>,
  event: Pick<EventRow, 'participantIds'>,
  { userId, production }: Reader,
): boolean {
  if (production) return true
  if (!event.participantIds.includes(userId)) return false
  if (item.audience.kind === 'ALL') return true
  if (item.audience.userIds.includes(userId)) return true
  return item.fields.some((f) => f.type === 'PEOPLE' && f.people.some((p) => p.userId === userId))
}
