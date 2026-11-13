import {
  dayHeading,
  isOutsidePeriod,
  type LocalDate,
  type LocalTime,
  type Period,
} from '@/shared/domain/local-dates'
import { timezoneCity } from '@/shared/domain/timezones'

import type { EventItem, Schedule } from './schemas'

/** One Event item as the Draft Event and the Timeline show it. */
export type ItemLine = {
  id: number
  name: string
  /** Local, as the place's clock shows it; `null` is "a definir" (or an item of the General info). */
  time: LocalTime | null
  /** "horário de Vitória": only for a time in a zone other than the Event's. */
  timezoneLabel: string | null
  /** Under the name: the place and the zone's label, "Vitória · horário de Vitória". */
  detail: string | null
  /** The item as the API sent it, for its editor. */
  item: EventItem
}

/** A day of the Timeline: "Sáb 21", and whether it falls outside the Event's period. */
export type DayLines = {
  date: LocalDate
  heading: string
  /** "FORA DO PERÍODO": the eve of the trip, or a day after it. */
  outsidePeriod: boolean
  items: ItemLine[]
}

export type ScheduleLines = {
  generalInfo: ItemLine[]
  days: DayLines[]
  isEmpty: boolean
}

/**
 * The schedule assembly (PRD, pure modules): turns `GET /events/:id/schedule` and the Event's
 * period into the lines of the screen. The General info apart; the days in date order, each item
 * on its own calendar date (the 00:40 transfer after Saturday's show is Sunday's), the untimed
 * first and then by time, ties in the order received (the production's). Every time stays local:
 * the zone only labels it, when it differs from the Event's.
 */
export function assembleSchedule(schedule: Schedule, period: Period): ScheduleLines {
  const byDate = new Map<LocalDate, EventItem[]>()
  for (const item of scheduleItems(schedule)) {
    if (!item.when) continue
    byDate.set(item.when.date, [...(byDate.get(item.when.date) ?? []), item])
  }
  const days = [...byDate.keys()].sort().map((date) => ({
    date,
    heading: dayHeading(date),
    outsidePeriod: isOutsidePeriod(date, period),
    // The sort is stable: ties keep the production's order.
    items: byDate
      .get(date)!
      .sort(untimedFirstThenByTime)
      .map((item) => lineOf(item, period.timezone)),
  }))
  const generalInfo = schedule.generalInfo.map((item) => lineOf(item, period.timezone))
  return { generalInfo, days, isEmpty: generalInfo.length === 0 && days.length === 0 }
}

/** Every item of the schedule, the General info's first. */
export function scheduleItems(schedule: Schedule): EventItem[] {
  return [...schedule.generalInfo, ...schedule.timeline.flatMap((day) => day.items)]
}

function untimedFirstThenByTime(a: EventItem, b: EventItem): number {
  const timeA = a.when?.time ?? null
  const timeB = b.when?.time ?? null
  if (timeA === timeB) return 0
  if (timeA === null) return -1
  if (timeB === null) return 1
  return timeA.localeCompare(timeB)
}

function lineOf(item: EventItem, eventTimezone: string): ItemLine {
  const time = item.when?.time ?? null
  const timezoneLabel =
    item.when && time !== null && item.when.timezone !== eventTimezone
      ? `horário de ${zoneName(item)}`
      : null
  const where = item.place?.name ?? item.place?.address ?? null
  const detail = [where, timezoneLabel].filter(Boolean).join(' · ') || null
  return { id: item.id, name: item.name, time, timezoneLabel, detail, item }
}

/**
 * Whose clock the time is: the place's name when the zone is the place's own ("Vitória", whose zone
 * is São Paulo's), else the zone's city.
 */
function zoneName({ when, place }: EventItem): string {
  if (place?.name && place.timezone === when!.timezone) return place.name
  return timezoneCity(when!.timezone)
}
