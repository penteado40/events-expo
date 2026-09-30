import { eventPlace, eventVenue, siteLabel } from '../event-place'

describe('eventPlace', () => {
  it('shows the type and the city', () => {
    expect(eventPlace({ type: 'WEDDING', city: 'Itu, SP' })).toBe('Casamento · Itu, SP')
    expect(eventPlace({ type: 'BABY_SHOWER', city: 'Campinas, SP' })).toBe(
      'Chá de bebê · Campinas, SP',
    )
  })

  it('shows just the type when the Event has no city', () => {
    expect(eventPlace({ type: 'CORPORATE', city: null })).toBe('Corporativo')
  })
})

describe('eventVenue', () => {
  it('joins the venue and the city', () => {
    expect(eventVenue({ venueName: 'Fazenda Santa Clara', city: 'Itu, SP' })).toBe(
      'Fazenda Santa Clara · Itu, SP',
    )
  })

  it('shows whichever of the two the Event has', () => {
    expect(eventVenue({ venueName: 'Bar do Alemão', city: null })).toBe('Bar do Alemão')
    expect(eventVenue({ venueName: null, city: 'Pinheiros, SP' })).toBe('Pinheiros, SP')
  })

  it('is null with neither, so the line is hidden', () => {
    expect(eventVenue({ venueName: null, city: null })).toBeNull()
  })
})

describe('siteLabel', () => {
  it.each([
    ['https://anaerafael.com.br', 'anaerafael.com.br'],
    ['http://offsite.kora.com.br/', 'offsite.kora.com.br'],
    ['https://site.com.br/ana-e-rafael', 'site.com.br/ana-e-rafael'],
  ])('%s → %s', (url, expected) => {
    expect(siteLabel(url)).toBe(expected)
  })
})
