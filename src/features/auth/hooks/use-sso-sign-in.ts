import { useSSO } from '@clerk/expo'
import { useMutation } from '@tanstack/react-query'
import * as AuthSession from 'expo-auth-session'

import { SignInError } from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'

export type SsoProvider = 'google' | 'apple'

/** `cancelled` when the person closed the browser without choosing an account. */
export type SsoSignInResult = 'signed-in' | 'cancelled'

/**
 * "Google" and "Apple": Clerk's browser flow, then the local User. An account of an email no User
 * has is refused by the API (`USER_NOT_INVITED`), as there is no open sign-up.
 */
export function useSsoSignIn() {
  const { startSSOFlow } = useSSO()
  return useMutation<SsoSignInResult, unknown, SsoProvider>({
    mutationFn: async (provider) => {
      await clearStaleIdentity()
      const { createdSessionId, setActive, authSessionResult } = await startSSOFlow({
        strategy: `oauth_${provider}`,
        // The app's scheme from app.json; the browser hands the redirect back to the flow.
        redirectUrl: AuthSession.makeRedirectUri(),
      })
      if (!createdSessionId || !setActive) {
        // Back from the provider without a session: a sign-up Clerk won't finish, as there is no
        // open sign-up. Only closing the browser is a cancel.
        if (authSessionResult?.type === 'success') throw new SignInError('sso_without_account')
        return 'cancelled'
      }
      await setActive({ session: createdSessionId })
      await openLiveSession()
      return 'signed-in'
    },
  })
}
