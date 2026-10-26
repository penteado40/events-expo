import { fireEvent, render, screen } from '@testing-library/react-native'

import { HappeningNow, NextEvents } from '../components/home-events'
import type { Event } from '../schemas'
import { eventFixture } from './event-fixture'

const event = (id: number, name: string, startsAt: string, fields: Partial<Event> = {}) =>
  eventFixture({ id, name, startsAt, type: 'BABY_SHOWER', city: 'Campinas, SP', ...fields })

// 11/10 at 15:00 in São Paulo; 24/10 at 20:00; 14/11 at 16:30.
const julia = event(15, 'Chá da Júlia', '2026-10-11T18:00:00.000Z')
const marcos = event(14, 'Marcos, 40', '2026-10-24T23:00:00.000Z', { type: 'BIRTHDAY' })
const ana = event(12, 'Ana & Rafael', '2026-11-14T19:30:00.000Z', { type: 'WEDDING', city: null })

describe('HappeningNow', () => {
  it('shows a card per Event, with its day, place and "agora", each opening it', async () => {
    const onOpen = jest.fn()
    await render(<HappeningNow events={[julia, marcos]} onOpen={onOpen} />)

    expect(screen.getByText('ACONTECENDO AGORA')).toBeOnTheScreen()
    expect(screen.getByText('11')).toBeOnTheScreen()
    expect(screen.getAllByText('OUT')).toHaveLength(2)
    expect(screen.getByText('Chá de bebê · Campinas, SP')).toBeOnTheScreen()
    expect(screen.getAllByText('agora')).toHaveLength(2)
    await fireEvent.press(screen.getByRole('button', { name: 'Acontecendo agora: Marcos, 40' }))
    expect(onOpen).toHaveBeenCalledWith(14)
  })

  it('is hidden with no Event', async () => {
    await render(<HappeningNow events={[]} onOpen={jest.fn()} />)

    expect(screen.queryByText('ACONTECENDO AGORA')).toBeNull()
  })
})

describe('NextEvents', () => {
  it('shows the nearest Event with its distance, stacked over the others within 30 days', async () => {
    const onOpen = jest.fn()
    const upcoming = [
      { event: julia, days: 10 },
      { event: marcos, days: 23 },
    ]
    await render(<NextEvents next={upcoming[0]} upcoming={upcoming} onOpen={onOpen} />)

    expect(screen.getByText('PRÓXIMOS EVENTOS')).toBeOnTheScreen()
    expect(screen.getByText('em 10 dias')).toBeOnTheScreen()
    expect(screen.queryByText('Marcos, 40')).toBeNull()
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Próximo evento: Chá da Júlia, em 10 dias. Mais 1 nos próximos 30 dias',
      }),
    )
    expect(onOpen).toHaveBeenCalledWith(15)
  })

  it('counts every other Event within 30 days', async () => {
    const upcoming = [
      { event: julia, days: 10 },
      { event: marcos, days: 23 },
      { event: ana, days: 30 },
    ]
    await render(<NextEvents next={upcoming[0]} upcoming={upcoming} onOpen={jest.fn()} />)

    expect(
      screen.getByRole('button', {
        name: 'Próximo evento: Chá da Júlia, em 10 dias. Mais 2 nos próximos 30 dias',
      }),
    ).toBeOnTheScreen()
  })

  it.each([
    ['alone within 30 days', [{ event: julia, days: 0 }]],
    ['beyond 30 days', []],
  ])('mentions no other Event when %s', async (_, upcoming) => {
    await render(
      <NextEvents next={{ event: julia, days: 0 }} upcoming={upcoming} onOpen={jest.fn()} />,
    )

    expect(
      screen.getByRole('button', { name: 'Próximo evento: Chá da Júlia, hoje' }),
    ).toBeOnTheScreen()
  })

  it('shows just the type when the Event has no city', async () => {
    await render(<NextEvents next={{ event: ana, days: 44 }} upcoming={[]} onOpen={jest.fn()} />)

    expect(screen.getByText('Casamento')).toBeOnTheScreen()
    expect(screen.getByText('14')).toBeOnTheScreen()
    expect(screen.getByText('NOV')).toBeOnTheScreen()
  })

  it('is hidden with nothing upcoming', async () => {
    await render(<NextEvents next={null} upcoming={[]} onOpen={jest.fn()} />)

    expect(screen.queryByText('PRÓXIMOS EVENTOS')).toBeNull()
  })
})
