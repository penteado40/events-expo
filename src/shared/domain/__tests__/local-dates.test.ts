import {
  dayAndMonth,
  deviceToday,
  isFinished,
  longDate,
  periodLabel,
  periodDays,
  todayIn,
  weekday,
  type Period,
} from '../local-dates'

const manaus: Period = {
  startDate: '2026-11-20',
  endDate: '2026-11-22',
  timezone: 'America/Manaus',
}

describe('todayIn', () => {
  it('is the calendar date in that timezone, not in UTC', () => {
    // 02:30 UTC on the 23rd is still 22:30 on the 22nd in Manaus (UTC−4).
    const now = new Date('2026-11-23T02:30:00Z')

    expect(todayIn('America/Manaus', now)).toBe('2026-11-22')
    expect(todayIn('UTC', now)).toBe('2026-11-23')
    expect(todayIn('Asia/Tokyo', now)).toBe('2026-11-23')
  })
})

describe('deviceToday', () => {
  it("is the device's local calendar date", () => {
    const now = new Date(2026, 9, 31, 23, 50)

    expect(deviceToday(now)).toBe('2026-10-31')
  })
})

describe('isFinished (Finished event)', () => {
  it.each([
    ['before it starts', '2026-11-19T15:00:00Z', false],
    ['on its last day', '2026-11-22T15:00:00Z', false],
    ['late on its last day in Manaus, already the next day in UTC', '2026-11-23T03:59:00Z', false],
    ['once its last day is over in Manaus', '2026-11-23T04:00:00Z', true],
    ['weeks later', '2026-12-20T12:00:00Z', true],
  ])('%s → %p', (_, now, finished) => {
    expect(isFinished(manaus, new Date(now))).toBe(finished)
  })

  it('a one-day Event is finished the day after', () => {
    const rehearsal: Period = {
      startDate: '2026-11-05',
      endDate: '2026-11-05',
      timezone: 'America/Sao_Paulo',
    }

    expect(isFinished(rehearsal, new Date('2026-11-05T23:00:00-03:00'))).toBe(false)
    expect(isFinished(rehearsal, new Date('2026-11-06T00:00:00-03:00'))).toBe(true)
  })
})

describe('formatting, without converting', () => {
  it('reads the date as written, whatever the timezone of the device', () => {
    expect(dayAndMonth('2026-11-20')).toEqual({ day: '20', month: 'NOV' })
    expect(dayAndMonth('2026-11-05')).toEqual({ day: '05', month: 'NOV' })
    expect(dayAndMonth('2027-01-01')).toEqual({ day: '01', month: 'JAN' })
  })

  it.each([
    ['2026-11-20', 'sex.'],
    ['2026-11-22', 'dom.'],
    ['2026-10-29', 'qui.'],
    ['2026-11-28', 'sáb.'],
    ['2024-02-29', 'qui.'],
  ])('%s is a %s', (date, day) => {
    expect(weekday(date)).toBe(day)
  })

  it('writes the long date of the greeting in pt-BR', () => {
    expect(longDate('2026-10-29')).toBe('qui., 29 de out.')
    expect(longDate('2026-12-01')).toBe('ter., 1 de dez.')
  })

  it.each([
    [manaus, 3],
    [{ ...manaus, endDate: '2026-11-20' }, 1],
    [{ startDate: '2026-12-30', endDate: '2027-01-02', timezone: 'UTC' }, 4],
    // Across the end of daylight saving time somewhere: still whole calendar days.
    [{ startDate: '2026-10-31', endDate: '2026-11-02', timezone: 'America/New_York' }, 3],
  ])('counts the days of a period, both ends included', (period, days) => {
    expect(periodDays(period)).toBe(days)
  })
})

describe('periodLabel', () => {
  it.each([
    [{ startDate: '2026-11-20', endDate: '2026-11-22' }, '20 a 22 de nov.'],
    [{ startDate: '2026-11-05', endDate: '2026-11-05' }, '5 de nov.'],
    [{ startDate: '2026-12-30', endDate: '2027-01-02' }, '30 de dez. a 2 de jan.'],
    [{ startDate: '2026-10-31', endDate: '2026-11-01' }, '31 de out. a 1 de nov.'],
  ])('writes %p as %p', (dates, label) => {
    expect(periodLabel({ ...dates, timezone: 'America/Sao_Paulo' })).toBe(label)
  })
})
