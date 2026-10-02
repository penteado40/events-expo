import { fireEvent, render, screen } from '@testing-library/react-native'

import { EventCard } from '../components/event-card'
import type { Event } from '../schemas'

const event = (overrides: Partial<Event> & { rsvpCount?: number } = {}): Event => {
  const { rsvpCount = 5, ...fields } = overrides
  return {
    id: 12,
    type: 'WEDDING',
    status: 'ACTIVE',
    name: 'Ana & Rafael',
    slug: 'ana-e-rafael',
    siteUrl: 'https://anaerafael.com.br',
    startsAt: '2026-11-14T19:30:00.000Z',
    endsAt: null,
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR',
    currency: 'BRL',
    venueName: 'Fazenda Santa Clara',
    venueAddress: null,
    city: 'Itu, SP',
    mapsUrl: null,
    membership: { role: 'OWNER', isPrimaryOwner: true },
    paidContributionCount: 3,
    summary: { rsvpCount, verifiedAmount: 1090, registryItemCount: 5 },
    ...fields,
  }
}

async function renderCard(item: Event) {
  const onOpen = jest.fn()
  await render(<EventCard event={item} onOpen={onOpen} />)
  return onOpen
}

const card = () => screen.getByRole('button')

describe('EventCard', () => {
  it.each([
    [0, '0 confirmados'],
    [1, '1 confirmado'],
    [5, '5 confirmados'],
  ])('shows %i RSVPs as "%s"', async (rsvpCount, text) => {
    await renderCard(event({ rsvpCount }))

    expect(screen.getByText(text)).toBeOnTheScreen()
  })

  it('reads as one button with the counts in its label', async () => {
    await renderCard(event({ paidContributionCount: 1, rsvpCount: 1 }))

    expect(card()).toHaveAccessibleName('Ana & Rafael, 1 confirmado, 1 pendente')
  })

  it('names an archived Event as such and leaves out pending when there are none', async () => {
    await renderCard(event({ status: 'ARCHIVED', paidContributionCount: 0, rsvpCount: 0 }))

    expect(card()).toHaveAccessibleName('Ana & Rafael, arquivado, 0 confirmados')
    expect(screen.getByText('arquivado')).toBeOnTheScreen()
    expect(screen.queryByText(/pendente/)).toBeNull()
  })

  it('opens Resumo from the card', async () => {
    const onOpen = await renderCard(event())

    await fireEvent.press(card())

    expect(onOpen).toHaveBeenCalledWith('summary')
  })

  it('opens RSVPs from the "confirmados" chip, without also opening Resumo', async () => {
    const onOpen = await renderCard(event())

    await fireEvent.press(screen.getByTestId('chip-confirmed'))

    expect(onOpen.mock.calls).toEqual([['rsvps']])
  })

  it('opens Conferir from the "pendentes" chip, without also opening Resumo', async () => {
    const onOpen = await renderCard(event())

    await fireEvent.press(screen.getByTestId('chip-pending'))

    expect(onOpen.mock.calls).toEqual([['contributions']])
  })

  it("keeps the chips out of the screen reader's way: the card's actions stand for them", async () => {
    const onOpen = await renderCard(event())

    expect(screen.getByTestId('chip-confirmed')).toHaveProp('accessible', false)
    expect(card()).toHaveProp('accessibilityActions', [
      { name: 'rsvps', label: 'Ver RSVPs' },
      { name: 'contributions', label: 'Ver Conferir' },
    ])

    await fireEvent(card(), 'accessibilityAction', { nativeEvent: { actionName: 'contributions' } })
    await fireEvent(card(), 'accessibilityAction', { nativeEvent: { actionName: 'rsvps' } })

    expect(onOpen.mock.calls).toEqual([['contributions'], ['rsvps']])
  })

  it('offers no Conferir action when nothing is pending', async () => {
    await renderCard(event({ paidContributionCount: 0 }))

    expect(card()).toHaveProp('accessibilityActions', [{ name: 'rsvps', label: 'Ver RSVPs' }])
  })
})
