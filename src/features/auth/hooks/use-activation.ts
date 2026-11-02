import { useSignUp } from '@clerk/expo'
import { useMutation, useQuery } from '@tanstack/react-query'

import type { ActivationLink } from '../activation-link'
import { SignInError, throwIfError } from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'
import { useSsoSignIn } from './use-sso-sign-in'

/** What Clerk says the Activation link is for, once it has read the ticket. */
export type Invitation = { email: string }

/**
 * "Ativar conta" (D-Ativar) over the Activation link, a Clerk invitation (events-api ADR-0020):
 * the ticket gives the invitation's email; then a new password or Google or Apple of that same
 * email activates the account and opens a Live session, like any sign-in.
 */
export function useActivation({ ticket, alreadyActive }: ActivationLink) {
  const { signUp } = useSignUp()

  const invitation = useQuery<Invitation>({
    queryKey: ['activation', ticket],
    queryFn: async () => {
      // Clerk already has the account (the link was accepted before), or no ticket came with it.
      if (!ticket || alreadyActive) throw new SignInError('activation_link_gone')
      await clearStaleIdentity()
      throwIfError(await signUp.ticket({ ticket }))
      if (!signUp.emailAddress) throw new SignInError('activation_link_gone')
      return { email: signUp.emailAddress }
    },
    // Reading the ticket starts Clerk's sign-up: once per link, never refetched.
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })

  const activate = useMutation<void, unknown, string>({
    mutationFn: async (password) => {
      throwIfError(await signUp.password({ password }))
      // Anything left besides the password (an instance setting the app has no step for).
      if (signUp.status !== 'complete') throw new SignInError(`sign_up_${signUp.status}`)
      throwIfError(await signUp.finalize())
      await openLiveSession()
    },
  })

  const sso = useSsoSignIn({ onlyEmail: invitation.data?.email })

  return { invitation, activate, sso }
}
