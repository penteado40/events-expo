import { eventPlace } from '../event-place'

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
