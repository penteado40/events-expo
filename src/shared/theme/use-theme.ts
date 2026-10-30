import { useColorScheme } from 'react-native'

import { themeFor, type Theme } from './tokens'

/** The design D theme for the system's light or dark mode, following it as it changes. */
export function useTheme(): Theme {
  return themeFor(useColorScheme())
}
