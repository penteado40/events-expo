import { fireEvent, render, screen } from '@testing-library/react-native'

import { PendingByEvent, PendingHero } from '../components/home-pending'

describe('PendingHero', () => {
  it.each([
    [4, '4 contribuições para conferir'],
    [1, '1 contribuição para conferir'],
    [0, '0 contribuições para conferir'],
  ])('shows %i as a button labelled "%s"', async (total, label) => {
    const onOpen = jest.fn()
    await render(<PendingHero total={total} onOpen={onOpen} />)

    expect(screen.getByText('PARA CONFERIR')).toBeOnTheScreen()
    expect(screen.getByText('contribuições marcadas como pagas')).toBeOnTheScreen()
    expect(screen.getByText(String(total))).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: label }))
    expect(onOpen).toHaveBeenCalled()
  })
})

describe('PendingByEvent', () => {
  const rows = [
    { id: 12, name: 'Ana & Rafael', count: 3 },
    { id: 14, name: 'Marcos, 40', count: 1 },
  ]

  it('lists each Event with its pending chip, and opens the tapped one', async () => {
    const onOpen = jest.fn()
    await render(<PendingByEvent rows={rows} onOpen={onOpen} />)

    expect(screen.getByText('CONFERIR POR EVENTO')).toBeOnTheScreen()
    expect(screen.getByText('3 pendentes')).toBeOnTheScreen()
    expect(screen.getByText('1 pendente')).toBeOnTheScreen()
    await fireEvent.press(screen.getByRole('button', { name: 'Marcos, 40, 1 pendente' }))
    expect(onOpen).toHaveBeenCalledWith(14)
  })

  it('is hidden with no row', async () => {
    await render(<PendingByEvent rows={[]} onOpen={jest.fn()} />)

    expect(screen.queryByText('CONFERIR POR EVENTO')).toBeNull()
  })
})
