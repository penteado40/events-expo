import { sortRsvps } from '../rsvp-order'

describe('sortRsvps', () => {
  const rsvp = (name: string, createdAt: string) => ({ name, createdAt })

  it('lists the most recent answer first', () => {
    const rsvps = [
      rsvp('Otávio Kern', '2026-09-01T15:00:00.000Z'),
      rsvp('Jonas Lemos', '2026-09-03T15:00:00.000Z'),
      rsvp('Isabela Faria', '2026-09-02T15:00:00.000Z'),
    ]

    expect(sortRsvps(rsvps).map((r) => r.name)).toEqual([
      'Jonas Lemos',
      'Isabela Faria',
      'Otávio Kern',
    ])
  })

  it('does not change the list it was given', () => {
    const rsvps = [
      rsvp('Otávio Kern', '2026-09-01T15:00:00.000Z'),
      rsvp('Jonas Lemos', '2026-09-03T15:00:00.000Z'),
    ]

    sortRsvps(rsvps)

    expect(rsvps.map((r) => r.name)).toEqual(['Otávio Kern', 'Jonas Lemos'])
  })
})
