import { z } from 'zod'

/**
 * Local dates (PROJ-210, events-api ADR-0016): a calendar date as the place lives it, with the
 * timezone beside it, never converted to the device's or to UTC. Only "today" needs a clock.
 */

/** A calendar date, `YYYY-MM-DD`; compares correctly as a string. */
export type LocalDate = string

export const localDateSchema = z.iso.date()

/** An Event's "when": calendar dates without time, in its default timezone (IANA). */
export const periodSchema = z.object({
  startDate: localDateSchema,
  endDate: localDateSchema,
  timezone: z.string().min(1),
})

export type Period = z.infer<typeof periodSchema>

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const WEEKDAYS = ['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.']
const DAY_MS = 86_400_000

const pad = (n: number) => String(n).padStart(2, '0')

function parts(date: LocalDate) {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

/** The date as a UTC midnight: only to count days and find the weekday, never shown. */
function asUtc(date: LocalDate) {
  const { year, month, day } = parts(date)
  return Date.UTC(year, month - 1, day)
}

/** Today's date in a timezone. */
export function todayIn(timezone: string, now: Date): LocalDate {
  // en-CA writes YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** A real calendar date written `YYYY-MM-DD` (no 30 Feb). */
export function isLocalDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const { year, month, day } = parts(text)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

/** Today's date where the device is. */
export function deviceToday(now: Date): LocalDate {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** A Finished event: its last day is over in its own timezone. Nobody sets it; it just happens. */
export function isFinished(period: Period, now: Date): boolean {
  return period.endDate < todayIn(period.timezone, now)
}

/** How many calendar days a period spans, both ends included. */
export function periodDays({ startDate, endDate }: Period): number {
  return Math.round((asUtc(endDate) - asUtc(startDate)) / DAY_MS) + 1
}

/** The date column of a list: "05" and "NOV". */
export function dayAndMonth(date: LocalDate): { day: string; month: string } {
  const { month, day } = parts(date)
  return { day: pad(day), month: MONTHS[month - 1].toUpperCase() }
}

/** The short weekday in pt-BR: "sex.". */
export function weekday(date: LocalDate): string {
  return WEEKDAYS[new Date(asUtc(date)).getUTCDay()]
}

/** The greeting's date: "qui., 29 de out.". */
export function longDate(date: LocalDate): string {
  const { month, day } = parts(date)
  return `${weekday(date)}, ${day} de ${MONTHS[month - 1]}.`
}

/** A period in words, without the weekday: "20 a 22 de nov.", "30 de dez. a 2 de jan.". */
export function periodLabel({ startDate, endDate }: Period): string {
  const start = parts(startDate)
  const end = parts(endDate)
  const dayOf = (d: { day: number; month: number }) => `${d.day} de ${MONTHS[d.month - 1]}.`
  if (startDate === endDate) return dayOf(start)
  const sameMonth = start.year === end.year && start.month === end.month
  return sameMonth ? `${start.day} a ${dayOf(end)}` : `${dayOf(start)} a ${dayOf(end)}`
}

/** A date as people type it, `DD/MM/AAAA`, read as a calendar date; null if it is not one. */
export function dateFromTyping(typed: string): LocalDate | null {
  const match = typed.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) return null
  const [, day, month, year] = match
  const date = `${year}-${pad(Number(month))}-${pad(Number(day))}`
  return isLocalDate(date) ? date : null
}

/** A date the way it is typed: "20/11/2026". */
export function typedDate(date: LocalDate): string {
  const { year, month, day } = parts(date)
  return `${pad(day)}/${pad(month)}/${year}`
}

/**
 * Puts the slashes into a date being typed on a number pad: "2011" shows "20/11". Text that
 * already has slashes is kept as typed, so "20/1" can still become "20/1/2027".
 */
export function typingDate(text: string): string {
  if (text.includes('/')) return text.replace(/[^\d/]/g, '').slice(0, 10)
  const digits = text.replace(/\D/g, '').slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/')
}
