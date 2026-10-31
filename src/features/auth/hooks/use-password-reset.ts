import { useSignIn } from '@clerk/expo'
import { useMutation } from '@tanstack/react-query'

import { finishSignIn, throwIfError } from '../clerk-sign-in'
import { clearStaleIdentity, openLiveSession } from '../open-live-session'

/**
 * "Esqueci a senha", Clerk's flow: a code to the email, the code, then the new password, which
 * also signs in. The password rule is Clerk's (events-api ADR-0020).
 */
export function usePasswordReset() {
  const { signIn } = useSignIn()

  const sendCode = useMutation<void, unknown, string>({
    mutationFn: async (email) => {
      await clearStaleIdentity()
      throwIfError(await signIn.create({ identifier: email.trim() }))
      throwIfError(await signIn.resetPasswordEmailCode.sendCode())
    },
  })
  const verifyCode = useMutation<void, unknown, string>({
    mutationFn: async (code) =>
      throwIfError(await signIn.resetPasswordEmailCode.verifyCode({ code: code.trim() })),
  })
  const setPassword = useMutation<void, unknown, string>({
    mutationFn: async (password) => {
      throwIfError(
        await signIn.resetPasswordEmailCode.submitPassword({
          password,
          signOutOfOtherSessions: true,
        }),
      )
      await finishSignIn(signIn)
      await openLiveSession()
    },
  })

  return { sendCode, verifyCode, setPassword }
}
