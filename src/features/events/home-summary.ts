import { canVerify } from '@/shared/domain/contributions'
import { isArchived, type EventStatus, type GuestDataScope } from '@/shared/domain/events'
import { sumMoney } from '@/shared/domain/money'

import type { Event } from './schemas'

/** Início's amounts: one currency for now, so the verified amounts add up as is. */
export const HOME_CURRENCY = 'BRL'

type SummedEvent = { status: EventStatus; summary: Event['summary'] }

/** Início's numbers: the active Events' Event summaries added up, and how many are archived. */
export type HomeSummary = {
  active: number
  archived: number
  rsvps: number
  verified: number
  registryItems: number
}

/**
 * Início's grid, from the Events list (ADR-0003): every number is about the active Events; the
 * archived ones are only counted.
 */
export function homeSummary(events: readonly SummedEvent[]): HomeSummary {
  const active = events.filter((event) => !isArchived(event))
  const sum = (amount: (event: SummedEvent) => number) =>
    active.reduce((total, event) => total + amount(event), 0)
  return {
    active: active.length,
    archived: events.length - active.length,
    rsvps: sum((event) => event.summary.rsvpCount),
    verified: sumMoney(active.map((event) => event.summary.verifiedAmount)),
    registryItems: sum((event) => event.summary.registryItemCount),
  }
}

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
