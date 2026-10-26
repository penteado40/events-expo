import { fireEvent, render, screen } from '@testing-library/react-native'
import { useState, type ComponentProps } from 'react'

import { HappeningNow, NextEvents } from '../components/home-events'
import type { Event } from '../schemas'
import { eventFixture } from './event-fixture'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))

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

type NextEventsProps = Omit<ComponentProps<typeof NextEvents>, 'expanded' | 'onExpandedChange'>

/** NextEvents with its expanded list kept open or closed, as Início keeps it. */
function Expandable(props: NextEventsProps) {
  const [expanded, setExpanded] = useState(false)
  return <NextEvents {...props} expanded={expanded} onExpandedChange={setExpanded} />
}

describe('NextEvents', () => {
  it('shows the nearest Event with its distance, stacked over the others within 30 days', async () => {
    const onOpen = jest.fn()
    const upcoming = [
      { event: julia, days: 10 },
      { event: marcos, days: 23 },
    ]
    await render(<Expandable next={upcoming[0]} upcoming={upcoming} onOpen={onOpen} />)

    expect(screen.getByText('PRÓXIMOS EVENTOS')).toBeOnTheScreen()
    expect(screen.getByText('em 10 dias')).toBeOnTheScreen()
    expect(screen.queryByText('Marcos, 40')).toBeNull()
    const card = screen.getByRole('button', {
      name: 'Próximo evento: Chá da Júlia, em 10 dias. Mais 1 nos próximos 30 dias',
    })
    expect(card.props.accessibilityHint).toBe('Abre a lista dos próximos 30 dias')
  })

  describe('with 2 or more Events within 30 days', () => {
    const upcoming = [
      { event: julia, days: 10 },
      { event: marcos, days: 23 },
      { event: ana, days: 30 },
    ]
    const stack = /^Próximo evento: Chá da Júlia/

    async function expand(onOpen = jest.fn()) {
      await render(<Expandable next={upcoming[0]} upcoming={upcoming} onOpen={onOpen} />)
      await fireEvent.press(screen.getByRole('button', { name: stack }))
      return onOpen
    }

    it('expands into the list of them, nearest first, instead of opening one', async () => {
      const onOpen = await expand()

      expect(onOpen).not.toHaveBeenCalled()
      expect(screen.getByText('PRÓXIMOS 30 DIAS')).toBeOnTheScreen()
      const cards = screen.getAllByRole('button', { name: /^Chá da Júlia|^Marcos, 40|^Ana/ })
      expect(cards.map((card) => card.props.accessibilityLabel)).toEqual([
        'Chá da Júlia, em 10 dias',
        'Marcos, 40, em 23 dias',
        'Ana & Rafael, em 30 dias',
      ])
      expect(screen.getByText('em 23 dias')).toBeOnTheScreen()
      expect(screen.getByRole('button', { name: 'Fechar' })).toBeOnTheScreen()
    })

    it('closes and opens the tapped Event', async () => {
      const onOpen = await expand()

      await fireEvent.press(screen.getByRole('button', { name: 'Marcos, 40, em 23 dias' }))
      expect(onOpen).toHaveBeenCalledWith(14)
      expect(screen.queryByText('PRÓXIMOS 30 DIAS')).toBeNull()
    })

    it('closes when a refetch leaves fewer than 2 within 30 days', async () => {
      const onExpandedChange = jest.fn()
      const props = { next: upcoming[0], onOpen: jest.fn(), expanded: true, onExpandedChange }
      await render(<NextEvents {...props} upcoming={upcoming} />)
      expect(onExpandedChange).not.toHaveBeenCalled()

      await screen.rerender(<NextEvents {...props} upcoming={upcoming.slice(0, 1)} />)
      expect(onExpandedChange).toHaveBeenCalledWith(false)
    })

    it('closes on a tap outside the list, opening nothing', async () => {
      const onOpen = await expand()

      await fireEvent.press(screen.getByRole('button', { name: 'Fechar' }))
      expect(screen.queryByText('PRÓXIMOS 30 DIAS')).toBeNull()
      expect(onOpen).not.toHaveBeenCalled()
      expect(screen.getByRole('button', { name: stack })).toBeOnTheScreen()
    })
  })

  it('counts every other Event within 30 days', async () => {
    const upcoming = [
      { event: julia, days: 10 },
      { event: marcos, days: 23 },
      { event: ana, days: 30 },
    ]
    await render(<Expandable next={upcoming[0]} upcoming={upcoming} onOpen={jest.fn()} />)

    expect(
      screen.getByRole('button', {
        name: 'Próximo evento: Chá da Júlia, em 10 dias. Mais 2 nos próximos 30 dias',
      }),
    ).toBeOnTheScreen()
  })

  it.each([
    ['alone within 30 days', [{ event: julia, days: 0 }]],
    ['beyond 30 days', []],
  ])('mentions no other Event and opens the nearest when %s', async (_, upcoming) => {
    const onOpen = jest.fn()
    await render(
      <Expandable next={{ event: julia, days: 0 }} upcoming={upcoming} onOpen={onOpen} />,
    )

    const card = screen.getByRole('button', { name: 'Próximo evento: Chá da Júlia, hoje' })
    expect(card.props.accessibilityHint).toBeUndefined()
    await fireEvent.press(card)
    expect(onOpen).toHaveBeenCalledWith(15)
    expect(screen.queryByText('PRÓXIMOS 30 DIAS')).toBeNull()
  })

  it('shows just the type when the Event has no city', async () => {
    await render(<Expandable next={{ event: ana, days: 44 }} upcoming={[]} onOpen={jest.fn()} />)

    expect(screen.getByText('Casamento')).toBeOnTheScreen()
    expect(screen.getByText('14')).toBeOnTheScreen()
    expect(screen.getByText('NOV')).toBeOnTheScreen()
  })

  it('is hidden with nothing upcoming', async () => {
    await render(<Expandable next={null} upcoming={[]} onOpen={jest.fn()} />)

    expect(screen.queryByText('PRÓXIMOS EVENTOS')).toBeNull()
  })
})
