import { plural } from './plural'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * How long ago an instant (ISO 8601) was, as the app says it: "agora", "há 20 min", "há 2 h",
 * "ontem", "há 3 dias", "há 1 mês", "há 2 anos". Counted in whole units from `now`, the caller's
 * clock (fixed in tests); an instant after `now`, a clock ahead, is "agora".
 */
export function timeAgo(at: string, now: Date): string {
  const ago = now.getTime() - new Date(at).getTime()
  if (ago < MINUTE) return 'agora'
  if (ago < HOUR) return `há ${Math.floor(ago / MINUTE)} min`
  if (ago < DAY) return `há ${Math.floor(ago / HOUR)} h`
  const days = Math.floor(ago / DAY)
  if (days === 1) return 'ontem'
  if (days < 30) return `há ${days} dias`
  if (days < 365) return `há ${plural(Math.floor(days / 30), 'mês', 'meses')}`
  return `há ${plural(Math.floor(days / 365), 'ano', 'anos')}`
}
