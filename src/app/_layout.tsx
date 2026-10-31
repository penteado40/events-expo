import { ClerkProvider } from '@clerk/expo'
import { tokenCache } from '@clerk/expo/token-cache'
import { QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, type ReactNode } from 'react'

import { useSessionCheck } from '@/features/auth'
import { CLERK_PUBLISHABLE_KEY } from '@/shared/lib/clerk-key'
import {
  clearCacheOnSignOut,
  createQueryClient,
  refetchOnAppFocus,
} from '@/shared/lib/query-client'
import { endIdentityWithSession, useSession } from '@/shared/session'
import { useAppFonts, useTheme } from '@/shared/theme'

SplashScreen.preventAutoHideAsync()

const queryClient = createQueryClient()
clearCacheOnSignOut(queryClient)
endIdentityWithSession()
refetchOnAppFocus()

/** Clerk around the app; a development build without its key runs without it (Demo mode only). */
function WithClerk({ children }: { children: ReactNode }) {
  if (CLERK_PUBLISHABLE_KEY === null) return children
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
      {children}
    </ClerkProvider>
  )
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
    <WithClerk>
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
    </WithClerk>
  )
}
