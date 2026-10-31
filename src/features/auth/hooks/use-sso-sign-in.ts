import { useSSO } from '@clerk/expo'
import { useMutation } from '@tanstack/react-query'
import * as AuthSession from 'expo-auth-session'

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
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: `oauth_${provider}`,
        redirectUrl: AuthSession.makeRedirectUri({ scheme: 'events-expo', path: 'sso-callback' }),
      })
      if (!createdSessionId || !setActive) return 'cancelled'
      await setActive({ session: createdSessionId })
      await openLiveSession()
      return 'signed-in'
    },
  })
}
