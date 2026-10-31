import { useSSO } from '@clerk/expo'
import { useSignInWithApple } from '@clerk/expo/apple'
import { useMutation } from '@tanstack/react-query'
import * as AuthSession from 'expo-auth-session'
import { Platform } from 'react-native'

import { SignInError } from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'

export type SsoProvider = 'google' | 'apple'

/** `cancelled` when the person closed the browser or Apple's sheet without choosing an account. */
export type SsoSignInResult = 'signed-in' | 'cancelled'

/**
 * "Google" and "Apple", then the local User. On iOS, Apple is the native sheet; elsewhere both go
 * through Clerk's browser flow. An email no User has is refused (`USER_NOT_INVITED`, or Clerk's
 * Restricted mode), as there is no open sign-up.
 */
export function useSsoSignIn() {
  const { startSSOFlow } = useSSO()
  const { startAppleAuthenticationFlow } = useSignInWithApple()

  async function startFlow(provider: SsoProvider) {
    if (provider === 'apple' && Platform.OS === 'ios') {
      // Apple's cancel comes back as no session, never as "success".
      return { ...(await startAppleAuthenticationFlow()), returnedFromProvider: false }
    }
    const { authSessionResult, ...result } = await startSSOFlow({
      strategy: `oauth_${provider}`,
      // The app's scheme from app.json; the browser hands the redirect back to the flow.
      redirectUrl: AuthSession.makeRedirectUri(),
    })
    return { ...result, returnedFromProvider: authSessionResult?.type === 'success' }
  }

  return useMutation<SsoSignInResult, unknown, SsoProvider>({
    mutationFn: async (provider) => {
      await clearStaleIdentity()
      const { createdSessionId, setActive, returnedFromProvider } = await startFlow(provider)
      if (!createdSessionId || !setActive) {
        // Back from the provider without a session: a sign-up Clerk won't finish, as there is no
        // open sign-up. Only closing the browser is a cancel.
        if (returnedFromProvider) throw new SignInError('sso_without_account')
        return 'cancelled'
      }
      await setActive({ session: createdSessionId })
      await openLiveSession()
      return 'signed-in'
    },
  })
}
