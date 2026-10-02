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

/** `dd.mm.aa · HH:MM` in the Event's own timezone: the time on the invitation, not the device's. */
export function formatEventDate(startsAt: string, timezone: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(startsAt))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
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
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  return `${part('day')}/${part('month')} ${part('hour')}:${part('minute')}`
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

/** The "Para conferir" total: `PAID` Contributions across every visible Event. */
export const pendingTotal = (events: readonly { paidContributionCount: number }[]) =>
  events.reduce((total, event) => total + event.paidContributionCount, 0)
