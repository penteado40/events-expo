import { fireEvent, render, screen } from '@testing-library/react-native'
import type { ComponentProps } from 'react'

import { FloatingTabBar } from '../floating-tab-bar'

type Props = ComponentProps<typeof FloatingTabBar>

const TABS = [
  ['index', 'Início'],
  ['today', 'Hoje'],
  ['people', 'Pessoas'],
  ['profile', 'Perfil'],
] as const

/** The props expo-router's Tabs hands its tabBar, on the tab at `index`. */
function tabBarProps(index: number, { defaultPrevented = false } = {}) {
  const routes = TABS.map(([name]) => ({ key: `${name}-key`, name }))
  const descriptors = Object.fromEntries(
    TABS.map(([name, title]) => [`${name}-key`, { options: { title } }]),
  )
  const emitter = { emit: jest.fn(() => ({ defaultPrevented })) }
  const navigateToTab = jest.fn()
  const insets = { top: 0, right: 0, bottom: 0, left: 0 }
  const props = {
    state: { index, routes },
    descriptors,
    emitter,
    navigateToTab,
    insets,
  } as unknown as Props
  return { props, navigateToTab }
}

describe('FloatingTabBar', () => {
  it('has one tab per screen, named for screen readers, with the current one selected', async () => {
    await render(<FloatingTabBar {...tabBarProps(0).props} />)

    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      'Início',
      'Hoje',
      'Pessoas',
      'Perfil',
    ])
    expect(screen.getByRole('tab', { name: 'Início', selected: true })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Hoje', selected: false })).toBeTruthy()
  })

  it('goes to the tab pressed', async () => {
    const { props, navigateToTab } = tabBarProps(0)
    await render(<FloatingTabBar {...props} />)

    fireEvent.press(screen.getByRole('tab', { name: 'Pessoas' }))

    expect(navigateToTab).toHaveBeenCalledWith('people-key')
  })

  it('stays put when the current tab is pressed again, or a listener prevents it', async () => {
    const current = tabBarProps(1)
    await render(<FloatingTabBar {...current.props} />)
    fireEvent.press(screen.getByRole('tab', { name: 'Hoje' }))
    expect(current.navigateToTab).not.toHaveBeenCalled()

    const prevented = tabBarProps(1, { defaultPrevented: true })
    await render(<FloatingTabBar {...prevented.props} />)
    fireEvent.press(screen.getByRole('tab', { name: 'Perfil' }))
    expect(prevented.navigateToTab).not.toHaveBeenCalled()
  })
})
