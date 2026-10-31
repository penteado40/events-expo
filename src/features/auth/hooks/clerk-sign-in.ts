import type { useSignIn } from '@clerk/expo'

type SignIn = ReturnType<typeof useSignIn>['signIn']

/** Clerk's Core 3 methods answer `{ error }` instead of throwing: throw it, for the mutation. */
export function throwIfError({ error }: { error: unknown }) {
  if (error) throw error
}

/** Makes a complete sign-in Clerk's active session. Any other status is a step the app lacks. */
export async function finishSignIn(signIn: SignIn) {
  if (signIn.status !== 'complete') {
    throw new Error(`Clerk sign-in stopped at "${signIn.status}".`)
  }
  throwIfError(await signIn.finalize())
}
