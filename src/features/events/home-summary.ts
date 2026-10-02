import { isArchived, type EventStatus } from '@/shared/domain/events'
import { sumMoney } from '@/shared/domain/money'

import type { Event } from './schemas'

type Summed = { status: EventStatus; summary: Event['summary'] }

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
 * archived ones are only counted. One currency (BRL) for now, so the verified amounts add up as is.
 */
export function homeSummary(events: readonly Summed[]): HomeSummary {
  const active = events.filter((event) => !isArchived(event))
  const sum = (amount: (event: Summed) => number) =>
    active.reduce((total, event) => total + amount(event), 0)
  return {
    active: active.length,
    archived: events.length - active.length,
    rsvps: sum((event) => event.summary.rsvpCount),
    verified: sumMoney(active.map((event) => event.summary.verifiedAmount)),
    registryItems: sum((event) => event.summary.registryItemCount),
  }
}
