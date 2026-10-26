import type { Membership } from './roles'

export const EVENT_TYPES = [
  'WEDDING',
  'BIRTHDAY',
  'CORPORATE',
  'BABY_SHOWER',
  'PARTY',
  'OTHER',
] as const

export type EventType = (typeof EVENT_TYPES)[number]

export const EVENT_STATUSES = ['ACTIVE', 'ARCHIVED'] as const

export type EventStatus = (typeof EVENT_STATUSES)[number]

/** Reads `date`'s parts (`part('day')`...) as `options` format them in `timezone`, in pt-BR. */
function dateParts(date: Date, timezone: string, options: Intl.DateTimeFormatOptions) {
  const parts = new Intl.DateTimeFormat('pt-BR', { timeZone: timezone, ...options }).formatToParts(
    date,
  )
  return (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
}

/** `dd.mm.aa · HH:MM` in the Event's own timezone: the time on the invitation, not the device's. */
export function formatEventDate(startsAt: string, timezone: string): string {
  const part = dateParts(new Date(startsAt), timezone, {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  return `${part('day')}.${part('month')}.${part('year')} · ${part('hour')}:${part('minute')}`
}

/** `dd/mm` in the Event's timezone: the day an RSVP or Contribution happened, the same for everyone. */
export function formatEventDay(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(iso))
}

/** `dd/mm HH:MM` in the Event's timezone: when a Guest marked a Contribution paid (the sheet). */
export function formatEventDayTime(iso: string, timezone: string): string {
  const part = dateParts(new Date(iso), timezone, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  return `${part('day')}/${part('month')} ${part('hour')}:${part('minute')}`
}

/** The day and short month ("11", "OUT") in the Event's timezone: Início's date block. */
export function formatEventDayMonth(iso: string, timezone: string) {
  const part = dateParts(new Date(iso), timezone, { day: 'numeric', month: 'short' })
  return { day: part('day'), month: part('month').replace('.', '').toUpperCase() }
}

const DAY_MS = 86_400_000

/**
 * The calendar day `date` falls on in `timezone`, as a day count: subtracting two gives how many
 * days apart they are on that calendar, whatever the hours.
 */
export function calendarDay(date: Date, timezone: string): number {
  const part = dateParts(date, timezone, { year: 'numeric', month: 'numeric', day: 'numeric' })
  return Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day'))) / DAY_MS
}

export const isArchived = (event: { status: EventStatus }) => event.status === 'ARCHIVED'

/** What decides who sees an Event's Guest data: its status and the viewer's Membership. */
export type GuestDataScope = { status: EventStatus; membership: Membership | null }

/**
 * Whether the viewer sees the Event's Guest data (RSVPs, who contributed). After archiving only
 * Owners and the Super admin (no Membership) still do; the others get the Event summary
 * (events-api ADR-0011).
 */
export const canSeeGuests = (event: GuestDataScope) =>
  !isArchived(event) || event.membership === null || event.membership.role === 'OWNER'

type Sortable = { status: EventStatus; startsAt: string }

/** Active Events soonest first, then archived ones most recent first. The app sorts, not the API. */
export function sortEvents<E extends Sortable>(events: readonly E[]): E[] {
  const time = (event: E) => Date.parse(event.startsAt)
  return [...events].sort((a, b) => {
    if (isArchived(a) !== isArchived(b)) return isArchived(a) ? 1 : -1
    return isArchived(a) ? time(b) - time(a) : time(a) - time(b)
  })
}
