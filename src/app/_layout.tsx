import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'

import { Background, BlurTargetProvider } from '@/shared/components/ui'
import { useLastEmail, useSession } from '@/shared/session'
import { colors, useAppFonts } from '@/shared/theme'

SplashScreen.preventAutoHideAsync()

const theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', primary: colors.accent },
}

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())
  const fontsLoaded = useAppFonts()
  const sessionLoaded = useSession((state) => state.hydrated)
  const emailLoaded = useLastEmail((state) => state.hydrated)
  const signedIn = useSession((state) => state.session !== null)
  const ready = fontsLoaded && sessionLoaded && emailLoaded

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
