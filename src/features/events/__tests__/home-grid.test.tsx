import { fireEvent, render, screen } from '@testing-library/react-native'

import { HomeGrid } from '../components/home-grid'
import type { HomeSummary } from '../home-summary'

const summary = (overrides: Partial<HomeSummary> = {}): HomeSummary => ({
  active: 4,
  archived: 1,
  rsvps: 15,
  verified: 1960.5,
  registryItems: 12,
  ...overrides,
})

async function renderGrid(value: HomeSummary) {
  const onOpen = jest.fn()
  await render(<HomeGrid summary={value} onOpen={onOpen} />)
  return onOpen
}

// Intl separates "R$" from the amount with a no-break space.
const nbsp = (text: string) => text.replace(/ /g, '\u00a0')

describe('HomeGrid', () => {
  it('shows the four numbers about the active Events', async () => {
    await renderGrid(summary())

    expect(screen.getByText('EVENTOS ATIVOS')).toBeOnTheScreen()
    expect(screen.getByText('4')).toBeOnTheScreen()
    expect(screen.getByText('15')).toBeOnTheScreen()
    expect(screen.getByText(nbsp('R$ 1.960,50'))).toBeOnTheScreen()
    expect(screen.getByText('12')).toBeOnTheScreen()
    expect(screen.getByText('nos eventos ativos')).toBeOnTheScreen()
    expect(screen.getByText('em contribuições')).toBeOnTheScreen()
    expect(screen.getByText('itens nas listas')).toBeOnTheScreen()
  })

  it.each([
    [0, 'nenhum arquivado'],
    [1, '1 arquivado'],
    [3, '3 arquivados'],
  ])('says %i archived as "%s"', async (archived, text) => {
    await renderGrid(summary({ archived }))

    expect(screen.getByText(text)).toBeOnTheScreen()
  })

  it('makes every card a button whose label carries its value', async () => {
    await renderGrid(summary())

    expect(screen.getAllByRole('button').map((card) => card.props.accessibilityLabel)).toEqual([
      '4 eventos ativos, 1 arquivado',
      '15 confirmados nos eventos ativos',
      `${nbsp('R$ 1.960,50')} verificados em contribuições`,
      '12 presentes nas listas',
    ])
  })

  it('names one of each in the singular', async () => {
    await renderGrid(summary({ active: 1, archived: 0, rsvps: 1, registryItems: 1 }))

    expect(
      screen.getByRole('button', { name: '1 evento ativo, nenhum arquivado' }),
    ).toBeOnTheScreen()
    expect(
      screen.getByRole('button', { name: '1 confirmado nos eventos ativos' }),
    ).toBeOnTheScreen()
    expect(screen.getByRole('button', { name: '1 presente nas listas' })).toBeOnTheScreen()
  })

  it('opens Eventos from any card', async () => {
    const onOpen = await renderGrid(summary())

    for (const card of screen.getAllByRole('button')) await fireEvent.press(card)

    expect(onOpen).toHaveBeenCalledTimes(4)
  })
})
