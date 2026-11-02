import { useSignIn } from '@clerk/expo'
import { useMutation } from '@tanstack/react-query'

import {
  finishSignIn,
  startCodeStep,
  throwIfError,
  verifyCode,
  type CodeVia,
} from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'

type Credentials = { email: string; password: string }

/** "Entrar": the next step is the Início (`signed-in`) or a code, and where it comes from. */
export type PasswordSignInResult = 'signed-in' | CodeVia

/** "Entrar" with email and password: Clerk first, then the local User (`GET /me`). */
export function usePasswordSignIn() {
  const { signIn } = useSignIn()
  return useMutation<PasswordSignInResult, unknown, Credentials>({
    mutationFn: async ({ email, password }) => {
      await clearStaleIdentity()
      throwIfError(await signIn.password({ emailAddress: email.trim(), password }))
      // A device Clerk doesn't trust yet, or an account with MFA, needs a code first.
      const via = await startCodeStep(signIn)
      if (via) return via
      await finishSignIn(signIn)
      await openLiveSession()
      return 'signed-in'
    },
  })
}

/** The code that finishes a sign-in, after a correct password. */
export function useSignInCode() {
  const { signIn } = useSignIn()
  return useMutation<void, unknown, { via: CodeVia; code: string }>({
    mutationFn: async ({ via, code }) => {
      await verifyCode(signIn, via, code)
      await finishSignIn(signIn)
      await openLiveSession()
    },
  })
}
