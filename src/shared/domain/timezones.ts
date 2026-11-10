import type { LocalDate } from './local-dates'

/**
 * Timezones (PROJ-210, events-api ADR-0016): an Event's default one and an Event item's, as IANA
 * names, shown by city and offset ("Manaus (GMT−4)"), never used to convert a time.
 */

/** An IANA timezone this device's Intl knows, like `America/Manaus`. */
export function isTimezone(name: string): boolean {
  if (!name) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: name })
    return true
  } catch {
    return false
  }
}

/**
 * The timezones offered for an Event: Brazil's first (from the East), then a few abroad. Any other
 * IANA timezone an Event already has is still shown by its city.
 */
export const TIMEZONE_CHOICES = [
  'America/Sao_Paulo',
  'America/Bahia',
  'America/Fortaleza',
  'America/Recife',
  'America/Belem',
  'America/Noronha',
  'America/Campo_Grande',
  'America/Cuiaba',
  'America/Manaus',
  'America/Porto_Velho',
  'America/Boa_Vista',
  'America/Rio_Branco',
  'America/Argentina/Buenos_Aires',
  'America/Santiago',
  'America/New_York',
  'Europe/Lisbon',
] as const

const CITY_NAMES: Record<string, string> = {
  'America/Sao_Paulo': 'São Paulo',
  'America/Bahia': 'Salvador',
  'America/Belem': 'Belém',
  'America/Noronha': 'Fernando de Noronha',
  'America/Cuiaba': 'Cuiabá',
  'America/New_York': 'Nova York',
  'Europe/Lisbon': 'Lisboa',
}

/** The city a timezone is named after, in pt-BR: "Manaus", "São Paulo". */
export function timezoneCity(timezone: string): string {
  return CITY_NAMES[timezone] ?? timezone.split('/').pop()!.replace(/_/g, ' ')
}

/**
 * A timezone's offset from UTC on a date, as the design writes it: "GMT−4", "GMT+5:30", "GMT".
 * Computed from the wall clock at noon UTC of that date, so daylight saving time follows it.
 */
export function gmtOffset(timezone: string, date: LocalDate): string {
  const [year, month, day] = date.split('-').map(Number)
  const instant = Date.UTC(year, month - 1, day, 12)
  // en-CA writes "2026-11-20, 08:00".
  const wall = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(instant)
    .match(/(\d+)-(\d+)-(\d+),? (\d+):(\d+)/)!
  const [, y, m, d, h, min] = wall.map(Number)
  const minutes = Math.round((Date.UTC(y, m - 1, d, h, min) - instant) / 60_000)
  if (minutes === 0) return 'GMT'
  const sign = minutes < 0 ? '−' : '+'
  const hours = Math.floor(Math.abs(minutes) / 60)
  const rest = Math.abs(minutes) % 60
  return `GMT${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`
}

/** A timezone as a choice: "Manaus (GMT−4)". */
export function timezoneLabel(timezone: string, date: LocalDate): string {
  return `${timezoneCity(timezone)} (${gmtOffset(timezone, date)})`
}
