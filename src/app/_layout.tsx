import { QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import {
  clearCacheOnSignOut,
  createQueryClient,
  refetchOnAppFocus,
} from '@/shared/lib/query-client'
import { useAppFonts, useTheme } from '@/shared/theme'

SplashScreen.preventAutoHideAsync()

const queryClient = createQueryClient()
clearCacheOnSignOut(queryClient)
refetchOnAppFocus()

export default function RootLayout() {
  const fontsLoaded = useAppFonts()
  const { scheme, colors } = useTheme()
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme
  const navigationTheme = {
    ...base,
    colors: { ...base.colors, background: colors.bg, primary: colors.action, text: colors.text },
  }

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
