import type { useSignIn } from '@clerk/expo'

type SignIn = ReturnType<typeof useSignIn>['signIn']

/** A sign-in step the app itself refuses, with a code `signInErrorMessage` knows, like Clerk's. */
export class SignInError extends Error {
  constructor(readonly code: string) {
    super(code)
    this.name = 'SignInError'
  }
}

/** Clerk's Core 3 methods answer `{ error }` instead of throwing: throw it, for the mutation. */
export function throwIfError({ error }: { error: unknown }) {
  if (error) throw error
}

/** Makes a complete sign-in Clerk's active session. Any other status is a step the app lacks. */
export async function finishSignIn(signIn: SignIn) {
  if (signIn.status !== 'complete') {
    // E.g. `needs_second_factor`: MFA is off in the Clerk dashboard, so the app has no step for it.
    throw new SignInError(`sign_in_${signIn.status}`)
  }
  throwIfError(await signIn.finalize())
}
