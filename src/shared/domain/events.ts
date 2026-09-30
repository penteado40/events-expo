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

export const isArchived = (event: { status: EventStatus }) => event.status === 'ARCHIVED'

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
