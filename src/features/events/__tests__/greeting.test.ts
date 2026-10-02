import { firstName, formatToday } from '../greeting'

describe('firstName', () => {
  it.each([
    ['Cláudia Lima', 'Cláudia'],
    ['Otávio Kern', 'Otávio'],
    ['Admin', 'Admin'],
    ['Ana Beatriz Souza', 'Ana'],
  ])('%s → %s', (name, expected) => {
    expect(firstName(name)).toBe(expected)
  })
})

describe('formatToday', () => {
  it('names the weekday, day and month, short', () => {
    // Midday UTC: the same day in any timezone the device may be in.
    expect(formatToday(new Date('2026-10-01T12:00:00.000Z'))).toBe('qui., 1 de out.')
  })
})
