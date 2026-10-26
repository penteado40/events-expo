import { canVerify } from '@/shared/domain/contributions'
import {
  calendarDay,
  isArchived,
  sortEvents,
  type EventStatus,
  type GuestDataScope,
} from '@/shared/domain/events'
import { sumMoney } from '@/shared/domain/money'

import type { Event } from './schemas'

/** Início's amounts: one currency for now, so the verified amounts add up as is. */
export const HOME_CURRENCY = 'BRL'

/** What Início reads of an Event: its status, Event summary and dates. */
type HomeEvent = { status: EventStatus; summary: Event['summary'] } & Pick<
  Event,
  'startsAt' | 'endsAt' | 'timezone'
>

/** An Event yet to start, `days` calendar days away in its timezone (0 is today). */
export type Upcoming<E> = { event: E; days: number }

/** Início's grid: the active Events' Event summaries added up, and how many are archived. */
export type HomeNumbers = {
  active: number
  archived: number
  rsvps: number
  verified: number
  registryItems: number
}

/** Início from the Events list: its numbers, the active Events happening now and those to come. */
export type HomeSummary<E> = HomeNumbers & {
  /** Started and not ended, the earliest first. */
  happening: E[]
  /** The nearest one to start, however far. */
  next: Upcoming<E> | null
  /** The ones starting within UPCOMING_DAYS, the nearest first. */
  upcoming: Upcoming<E>[]
}

/** How far "Próximos eventos" looks ahead, in calendar days. */
export const UPCOMING_DAYS = 30

/** Calendar days from `now` to the Event's start, both on the Event's timezone's calendar. */
const daysUntil = (event: HomeEvent, now: Date) =>
  calendarDay(new Date(event.startsAt), event.timezone) - calendarDay(now, event.timezone)

/**
 * Started and not ended: before `endsAt` or, without one, still on the day it started in its
 * timezone.
 */
function isHappening(event: HomeEvent, now: Date): boolean {
  if (Date.parse(event.startsAt) > now.getTime()) return false
  return event.endsAt ? now.getTime() < Date.parse(event.endsAt) : daysUntil(event, now) === 0
}

/**
 * Início, from the Events list (ADR-0003): every number and list is about the active Events; the
 * archived ones are only counted. `now` is the render time.
 */
export function homeSummary<E extends HomeEvent>(events: readonly E[], now: Date): HomeSummary<E> {
  const active = sortEvents(events.filter((event) => !isArchived(event)))
  const sum = (amount: (event: E) => number) =>
    active.reduce((total, event) => total + amount(event), 0)
  const notStarted = active
    .filter((event) => Date.parse(event.startsAt) > now.getTime())
    .map((event) => ({ event, days: daysUntil(event, now) }))
  return {
    active: active.length,
    archived: events.length - active.length,
    rsvps: sum((event) => event.summary.rsvpCount),
    verified: sumMoney(active.map((event) => event.summary.verifiedAmount)),
    registryItems: sum((event) => event.summary.registryItemCount),
    happening: active.filter((event) => isHappening(event, now)),
    next: notStarted[0] ?? null,
    upcoming: notStarted.filter(({ days }) => days <= UPCOMING_DAYS),
  }
}

/** How far an upcoming Event is, as its card says it in lime: "hoje", "amanhã", "em N dias". */
export const distanceLabel = (days: number) =>
  days === 0 ? 'hoje' : days === 1 ? 'amanhã' : `em ${days} dias`

type PendingEvent = GuestDataScope & Pick<Event, 'id' | 'name' | 'paidContributionCount'>

/** An Event with Contributions waiting for the viewer's Verification: a row of "Conferir por evento". */
export type PendingRow = { id: number; name: string; count: number }

/**
 * Início's "Para conferir" hero: the PAID Contributions across the Events where the viewer does the
 * Verification (`canVerify`), 0 included. Null, and the hero hidden, when they verify none.
 */
export function pendingTotal(events: readonly PendingEvent[]): number | null {
  const verifiable = events.filter(canVerify)
  if (verifiable.length === 0) return null
  return verifiable.reduce((total, event) => total + event.paidContributionCount, 0)
}

/** "Conferir por evento": the Events the viewer verifies that have PAID ones, in the given order. */
export function pendingByEvent(events: readonly PendingEvent[]): PendingRow[] {
  return events
    .filter((event) => canVerify(event) && event.paidContributionCount > 0)
    .map(({ id, name, paidContributionCount }) => ({ id, name, count: paidContributionCount }))
}
