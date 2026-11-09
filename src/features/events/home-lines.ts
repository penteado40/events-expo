import { autoTone, type AutoTone } from '@/shared/domain/auto-tone'
import { isGroupMember, seesDrafts, type GroupRole } from '@/shared/domain/group-role'
import { foldText } from '@/shared/domain/fold-text'
import { dayAndMonth, isFinished, periodDays, weekday } from '@/shared/domain/local-dates'

import type { Event } from './schemas'

/** The Início's tabs: Próximos, Que eu vou, Passados. */
export type HomeTab = 'upcoming' | 'going' | 'past'

export type HomeOptions = {
  tab: HomeTab
  query: string
  now: Date
  /** The person's role in the Group: Drafts and "você não vai" depend on it. */
  role: GroupRole
}

/** The one state badge a line shows, always with text: CANCELADO, RASCUNHO or VOCÊ VAI. */
export type HomeBadge = 'cancelled' | 'draft' | 'going' | null

export type HomeLine = {
  event: Event
  tone: AutoTone
  badge: HomeBadge
  /** The cover card: the next Event the person goes to. At most one per list. */
  featured: boolean
  /** A Group member who is not a Participant. */
  notGoing: boolean
  /** Light stripe and muted name: not going, or Cancelled. */
  faded: boolean
  /** The name struck through: Cancelled. */
  struck: boolean
  /** The date column, as written in the Event's timezone. */
  start: { day: string; month: string }
  /** The last day under the first, for an Event of more than one day; its month may differ. */
  end: { day: string; month: string } | null
  days: number
  /** "sex. · Manaus, AM", plus "· você não vai". */
  subtitle: string
}

const byStart = (a: Event, b: Event) =>
  a.period.startDate.localeCompare(b.period.startDate) || a.id - b.id

/**
 * The Início of a Group (PROJ-215) as lines: the tab's Events in date order, filtered by the
 * search, each with the state it shows. The dates are read as written, never converted; an Event
 * moves to Passados once its last day is over in its own timezone (Finished event).
 */
export function homeLines(events: Event[], { tab, query, now, role }: HomeOptions): HomeLine[] {
  const search = foldText(query.trim())
  const chosen = events
    .filter((e) => (tab === 'past' ? isFinished(e.period, now) : !isFinished(e.period, now)))
    .filter((e) => tab !== 'going' || e.isParticipant)
    .filter((e) => !search || foldText(`${e.name} ${e.place}`).includes(search))
    .sort((a, b) => (tab === 'past' ? byStart(b, a) : byStart(a, b)))

  const featuredId =
    tab === 'past' ? undefined : chosen.find((e) => e.isParticipant && !e.cancelled)?.id

  return chosen.map((event) => {
    const { startDate, endDate } = event.period
    const notGoing = isGroupMember(role) && !event.isParticipant
    const badge: HomeBadge = event.cancelled
      ? 'cancelled'
      : event.status === 'DRAFT' && seesDrafts(role)
        ? 'draft'
        : event.isParticipant
          ? 'going'
          : null
    return {
      event,
      tone: autoTone(event.id),
      badge,
      featured: event.id === featuredId,
      notGoing,
      faded: notGoing || event.cancelled,
      struck: event.cancelled,
      start: dayAndMonth(startDate),
      end: endDate === startDate ? null : dayAndMonth(endDate),
      days: periodDays(event.period),
      subtitle: [weekday(startDate), event.place, notGoing && 'você não vai']
        .filter(Boolean)
        .join(' · '),
    }
  })
}
