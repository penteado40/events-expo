import { useSignIn } from '@clerk/expo'
import { useMutation } from '@tanstack/react-query'

import { finishSignIn, throwIfError } from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'

type Credentials = { email: string; password: string }

/** "Entrar": the next step is the Início (`signed-in`) or the code Clerk emailed (`needs-code`). */
export type PasswordSignInResult = 'signed-in' | 'needs-code'

/** "Entrar" with email and password: Clerk first, then the local User (`GET /me`). */
export function usePasswordSignIn() {
  const { signIn } = useSignIn()
  return useMutation<PasswordSignInResult, unknown, Credentials>({
    mutationFn: async ({ email, password }) => {
      await clearStaleIdentity()
      throwIfError(await signIn.password({ emailAddress: email.trim(), password }))
      // A device Clerk doesn't trust yet gets an emailed code first (Clerk's client trust).
      if (signIn.status === 'needs_client_trust') {
        throwIfError(await signIn.mfa.sendEmailCode())
        return 'needs-code'
      }
      await finishSignIn(signIn)
      await openLiveSession()
      return 'signed-in'
    },
  })
}

/** The code Clerk emailed to trust this device, after a correct password. */
export function useSignInCode() {
  const { signIn } = useSignIn()
  return useMutation<void, unknown, string>({
    mutationFn: async (code) => {
      throwIfError(await signIn.mfa.verifyEmailCode({ code: code.trim() }))
      await finishSignIn(signIn)
      await openLiveSession()
    },
  })
}
