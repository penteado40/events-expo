import { gmtOffset, isTimezone, TIMEZONE_CHOICES, timezoneLabel } from '../timezones'

describe('isTimezone', () => {
  it('knows IANA timezones and refuses anything else', () => {
    expect(isTimezone('America/Manaus')).toBe(true)
    expect(isTimezone('Mars/Olympus')).toBe(false)
    expect(isTimezone('')).toBe(false)
  })
})

describe('timezones', () => {
  it('writes the GMT offset of a timezone on a date, with a true minus', () => {
    expect(gmtOffset('America/Manaus', '2026-11-20')).toBe('GMT−4')
    expect(gmtOffset('America/Sao_Paulo', '2026-11-20')).toBe('GMT−3')
    expect(gmtOffset('America/Noronha', '2026-11-20')).toBe('GMT−2')
    expect(gmtOffset('UTC', '2026-11-20')).toBe('GMT')
    expect(gmtOffset('Asia/Kolkata', '2026-11-20')).toBe('GMT+5:30')
    // Daylight saving time follows the date.
    expect(gmtOffset('America/New_York', '2026-07-01')).toBe('GMT−4')
    expect(gmtOffset('America/New_York', '2026-12-01')).toBe('GMT−5')
  })

  it('names a timezone by its city, in pt-BR, with the offset', () => {
    expect(timezoneLabel('America/Manaus', '2026-11-20')).toBe('Manaus (GMT−4)')
    expect(timezoneLabel('America/Sao_Paulo', '2026-11-20')).toBe('São Paulo (GMT−3)')
    // One the app does not list still reads by its city.
    expect(timezoneLabel('Asia/Kolkata', '2026-11-20')).toBe('Kolkata (GMT+5:30)')
  })

  it('offers the Brazilian timezones first, every one known to Intl', () => {
    expect(TIMEZONE_CHOICES[0]).toBe('America/Sao_Paulo')
    expect(TIMEZONE_CHOICES).toContain('America/Manaus')
    expect(TIMEZONE_CHOICES.every(isTimezone)).toBe(true)
  })
})
