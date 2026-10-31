import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'

import { useSessionCheck } from '@/features/auth'
import {
  clearCacheOnSignOut,
  createQueryClient,
  refetchOnAppFocus,
} from '@/shared/lib/query-client'
import { endIdentityWithSession, useSession } from '@/shared/session'
import { useAppFonts, useTheme } from '@/shared/theme'

SplashScreen.preventAutoHideAsync()

/** Read as a literal `process.env.EXPO_PUBLIC_…` so Expo inlines it (see `.env.example`). */
const CLERK_PUBLISHABLE_KEY: string =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ??
  missing('EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set: the app signs in through Clerk.')

const queryClient = createQueryClient()
clearCacheOnSignOut(queryClient)
endIdentityWithSession()
refetchOnAppFocus()

function missing(message: string): never {
  throw new Error(message)
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts()
  const sessionLoaded = useSession((state) => state.hydrated)
  const signedIn = useSession((state) => state.session !== null)
  const { scheme, colors } = useTheme()
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme
  const navigationTheme = {
    ...base,
    colors: { ...base.colors, background: colors.bg, primary: colors.action, text: colors.text },
  }
  const ready = fontsLoaded && sessionLoaded
  // Optimistic startup: a saved Session enters at once; a Live one is re-checked in the background.
  useSessionCheck(sessionLoaded)

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}
          >
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/forgot-password" />
            </Stack.Protected>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(tabs)" />
            </Stack.Protected>
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  )
}
