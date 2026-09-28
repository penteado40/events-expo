import { QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { useSessionCheck } from '@/features/auth'
import { Background, BlurTargetProvider } from '@/shared/components/ui'
import { clearCacheOnSignOut, createQueryClient } from '@/shared/lib/query-client'
import { useLastEmail, useSession } from '@/shared/session'
import { colors, useAppFonts } from '@/shared/theme'

SplashScreen.preventAutoHideAsync()

const queryClient = createQueryClient()
clearCacheOnSignOut(queryClient)

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', primary: colors.accent },
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts()
  const sessionLoaded = useSession((state) => state.hydrated)
  const emailLoaded = useLastEmail((state) => state.hydrated)
  const signedIn = useSession((state) => state.session !== null)
  const ready = fontsLoaded && sessionLoaded && emailLoaded
  // Optimistic startup: a saved Session enters at once; a Live one is re-checked in the background.
  useSessionCheck(sessionLoaded)

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={theme}>
        <BlurTargetProvider>
          <StatusBar style="light" />
          <Background />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
          >
            <Stack.Screen name="index" />
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)/login" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
          </Stack>
        </BlurTargetProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
