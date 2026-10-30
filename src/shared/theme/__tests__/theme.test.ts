import { renderHook } from '@testing-library/react-native'
import * as ReactNative from 'react-native'

import { palette, themeFor, useTheme } from '..'

describe('themeFor', () => {
  it.each([
    ['bg', '#F6F7F9', '#0E1320'],
    ['surface', '#FFFFFF', '#171D2B'],
    ['surfaceBrand', '#EEF3FB', '#142038'],
    ['text', '#15171C', '#F2F4F8'],
    ['textMuted', '#5B6170', '#A7AEBD'],
    ['action', '#1F4FAE', '#2F63C9'],
    ['onAction', '#FFFFFF', '#FFFFFF'],
    ['link', '#1F4FAE', '#DBE7FF'],
  ] as const)('%s is %s in light mode and %s in dark mode', (role, light, dark) => {
    expect(themeFor('light').colors[role]).toBe(light)
    expect(themeFor('dark').colors[role]).toBe(dark)
  })

  it('uses light mode when the system has no preference', () => {
    expect(themeFor(null)).toBe(themeFor('light'))
    expect(themeFor('unspecified')).toBe(themeFor('light'))
  })

  it('tints badges and Team chips with steps 50/100 → 700 in light, 900 → 100 in dark', () => {
    expect(themeFor('light').badge('coral')).toEqual({ bg: '#FFF4F2', text: '#AB331C' })
    expect(themeFor('dark').badge('coral')).toEqual({ bg: '#52170C', text: '#FFE2DC' })
    expect(themeFor('light').teamChip('roxo')).toEqual({ bg: '#EDE5FE', text: '#7347AF' })
    expect(themeFor('dark').teamChip('roxo')).toEqual({ bg: '#352053', text: '#EDE5FE' })
  })

  it('keeps covers, headers and Timeline dots the same in both modes', () => {
    for (const scheme of ['light', 'dark'] as const) {
      const theme = themeFor(scheme)
      expect(theme.cover('verde')).toEqual(['#0D3B3A', '#1FB86A'])
      expect(theme.timelineDot('verde')).toBe('#1FB86A')
      expect(theme.header).toEqual(['#10204A', '#2F63C9'])
    }
  })

  it('has the five steps for the brand blue, the six categorical tones, red and gray', () => {
    expect(Object.keys(palette)).toEqual([
      'azul',
      'coral',
      'verde',
      'roxo',
      'rosa',
      'turquesa',
      'ouro',
      'vermelho',
      'cinza',
    ])
    for (const scale of Object.values(palette)) {
      expect(Object.keys(scale)).toEqual(['50', '100', '500', '700', '900'])
    }
  })
})

describe('useTheme', () => {
  afterEach(() => jest.restoreAllMocks())

  it.each(['light', 'dark'] as const)('follows the system in %s mode', async (scheme) => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue(scheme)

    const { result } = await renderHook(() => useTheme())

    expect(result.current).toBe(themeFor(scheme))
  })
})
