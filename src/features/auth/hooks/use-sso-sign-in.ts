import { useSSO } from '@clerk/expo'
import { useSignInWithApple } from '@clerk/expo/apple'
import { useMutation } from '@tanstack/react-query'
import * as AuthSession from 'expo-auth-session'
import { Platform } from 'react-native'

import { identity } from '@/shared/session'

import { SignInError } from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'

export type SsoProvider = 'google' | 'apple'

/** `cancelled` when the person closed the browser or Apple's sheet without choosing an account. */
export type SsoSignInResult = 'signed-in' | 'cancelled'

type Options = {
  /**
   * The only email accepted, as on "Ativar conta": an account of another one is signed out and
   * refused (`activation_other_email`), even if it is someone's account.
   */
  onlyEmail?: string
}

const sameEmail = (a: string | null, b: string) => a?.toLowerCase() === b.toLowerCase()

/**
 * "Google" and "Apple", then the local User. On iOS, Apple is the native sheet; elsewhere both go
 * through Clerk's browser flow. An email no User has is refused (`USER_NOT_INVITED`, or Clerk's
 * Restricted mode), as there is no open sign-up.
 */
export function useSsoSignIn({ onlyEmail }: Options = {}) {
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
      if (onlyEmail !== undefined && !sameEmail(await identity.email(), onlyEmail)) {
        await identity.signOut()
        throw new SignInError('activation_other_email')
      }
      await openLiveSession()
      return 'signed-in'
    },
  })
}
