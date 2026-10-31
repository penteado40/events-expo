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

/**
 * Where the code that finishes a sign-in comes from: the email (a device Clerk doesn't trust yet,
 * or an email second factor), an SMS, or an authenticator app (TOTP).
 */
export type CodeVia = 'email-code' | 'phone-code' | 'authenticator-code'

/**
 * After a correct password, the code step Clerk asks for, with the code already sent where one is
 * sent; null when the sign-in needs none. For MFA, the authenticator first (nothing to send), then
 * SMS, then email.
 */
export async function startCodeStep(signIn: SignIn): Promise<CodeVia | null> {
  if (signIn.status === 'needs_client_trust') {
    throwIfError(await signIn.mfa.sendEmailCode())
    return 'email-code'
  }
  if (signIn.status !== 'needs_second_factor') return null
  const strategies = signIn.supportedSecondFactors.map((factor) => factor.strategy)
  if (strategies.includes('totp')) return 'authenticator-code'
  if (strategies.includes('phone_code')) {
    throwIfError(await signIn.mfa.sendPhoneCode())
    return 'phone-code'
  }
  if (strategies.includes('email_code')) {
    throwIfError(await signIn.mfa.sendEmailCode())
    return 'email-code'
  }
  // Passkeys or backup codes only: the app has no step for them.
  throw new SignInError('sign_in_needs_second_factor')
}

/** Checks the code the step asked for. */
export async function verifyCode(signIn: SignIn, via: CodeVia, code: string) {
  const params = { code: code.trim() }
  const verify = {
    'email-code': () => signIn.mfa.verifyEmailCode(params),
    'phone-code': () => signIn.mfa.verifyPhoneCode(params),
    'authenticator-code': () => signIn.mfa.verifyTOTP(params),
  }[via]
  throwIfError(await verify())
}

/** Makes a complete sign-in Clerk's active session. Any other status is a step the app lacks. */
export async function finishSignIn(signIn: SignIn) {
  if (signIn.status !== 'complete') throw new SignInError(`sign_in_${signIn.status}`)
  throwIfError(await signIn.finalize())
}
