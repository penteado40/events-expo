import { timeAgo } from '../relative-time'

describe('timeAgo', () => {
  // A fixed clock: Saturday 21 Nov 2026, 18:00 in Manaus.
  const now = new Date('2026-11-21T22:00:00.000Z')
  const before = (ms: number) => new Date(now.getTime() - ms).toISOString()
  const MIN = 60_000
  const HOUR = 60 * MIN
  const DAY = 24 * HOUR

  it.each([
    [0, 'agora'],
    [59_000, 'agora'],
    [MIN, 'há 1 min'],
    [20 * MIN, 'há 20 min'],
    [59 * MIN + 59_000, 'há 59 min'],
    [HOUR, 'há 1 h'],
    [2 * HOUR, 'há 2 h'],
    [23 * HOUR + 59 * MIN, 'há 23 h'],
    [DAY, 'ontem'],
    [2 * DAY - 1, 'ontem'],
    [2 * DAY, 'há 2 dias'],
    [29 * DAY, 'há 29 dias'],
    [30 * DAY, 'há 1 mês'],
    [90 * DAY, 'há 3 meses'],
    [365 * DAY, 'há 1 ano'],
    [800 * DAY, 'há 2 anos'],
  ])('%d ms before is "%s"', (ago, text) => {
    expect(timeAgo(before(ago), now)).toBe(text)
  })

  it('takes an instant after now (a clock ahead) as "agora"', () => {
    expect(timeAgo(before(-5 * MIN), now)).toBe('agora')
  })
})
