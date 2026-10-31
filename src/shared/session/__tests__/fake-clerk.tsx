import type { ReactNode } from 'react'

/** The code the fake "emails" for client trust and password reset. */
export const FAKE_CODE = '424242'

/** The token the fake Clerk issues for an email, as the fake API's verifier reads it back. */
export const fakeTokenFor = (email: string) => `clerk:${email}`

type ClerkErrorLike = { code: string; message: string; errors: { code: string; message: string }[] }

const clerkError = (code: string, message = code): ClerkErrorLike => ({
  code,
  message,
  errors: [{ code, message }],
})

type SignInStatus =
  | 'needs_identifier'
  | 'needs_first_factor'
  | 'needs_client_trust'
  | 'needs_new_password'
  | 'complete'

/**
 * A stand-in for Clerk in tests: accounts with a password, an optional email-code step for an
 * untrusted device, Google/Apple answering with a chosen email, and the session it ends up in.
 * Only the slice of `@clerk/expo` the app uses.
 */
export function createFakeClerk() {
  const accounts = new Map<string, string>()
  let sessionCount = 0
  let pendingEmail: string | null = null

  const clerk = {
    loaded: true,
    session: null as { id: string; getToken: () => Promise<string | null> } | null,
    user: null as { primaryEmailAddress: { emailAddress: string } } | null,
    /** When true, a correct password still asks for the emailed code (Clerk's client trust). */
    requireClientTrust: false,
    /** The email Google or Apple answers with; null = the person closed the browser. */
    ssoEmail: null as string | null,
    signOutCount: 0,

    addAccount(email: string, password: string) {
      accounts.set(email, password)
    },
    /** Starts already signed in, as Clerk's token cache restores it. */
    restore(email: string) {
      activate(email)
    },
    async signOut() {
      clerk.signOutCount += 1
      clerk.session = null
      clerk.user = null
    },
    on(_event: 'status', handler: (status: string) => void) {
      handler('ready')
    },
    off() {},

    signIn: createSignIn(),
    reset() {
      accounts.clear()
      sessionCount = 0
      pendingEmail = null
      clerk.session = null
      clerk.user = null
      clerk.requireClientTrust = false
      clerk.ssoEmail = null
      clerk.signOutCount = 0
      clerk.signIn = createSignIn()
    },
  }

  function activate(email: string) {
    sessionCount += 1
    const token = fakeTokenFor(email)
    clerk.session = { id: `sess_${sessionCount}`, getToken: async () => token }
    clerk.user = { primaryEmailAddress: { emailAddress: email } }
  }

  /** The Core 3 `SignInFuture` resource, enough of it for the app's flows. */
  function createSignIn() {
    const ok = { error: null }
    const fail = (error: ClerkErrorLike) => ({ error })
    const signIn = {
      status: 'needs_identifier' as SignInStatus,
      async password({ emailAddress, password }: { emailAddress: string; password: string }) {
        if (clerk.session) return fail(clerkError('session_exists'))
        if (!accounts.has(emailAddress)) return fail(clerkError('form_identifier_not_found'))
        if (accounts.get(emailAddress) !== password) {
          return fail(clerkError('form_password_incorrect'))
        }
        pendingEmail = emailAddress
        signIn.status = clerk.requireClientTrust ? 'needs_client_trust' : 'complete'
        return ok
      },
      mfa: {
        sendEmailCode: async () => ok,
        async verifyEmailCode({ code }: { code: string }) {
          if (code !== FAKE_CODE) return fail(clerkError('form_code_incorrect'))
          signIn.status = 'complete'
          return ok
        },
      },
      async create({ identifier }: { identifier: string }) {
        if (clerk.session) return fail(clerkError('session_exists'))
        if (!accounts.has(identifier)) return fail(clerkError('form_identifier_not_found'))
        pendingEmail = identifier
        signIn.status = 'needs_first_factor'
        return ok
      },
      resetPasswordEmailCode: {
        sendCode: async () => ok,
        async verifyCode({ code }: { code: string }) {
          if (code !== FAKE_CODE) return fail(clerkError('form_code_incorrect'))
          signIn.status = 'needs_new_password'
          return ok
        },
        async submitPassword({ password }: { password: string }) {
          if (password.length < 8) return fail(clerkError('form_password_length_too_short'))
          accounts.set(pendingEmail!, password)
          signIn.status = 'complete'
          return ok
        },
      },
      async finalize() {
        if (signIn.status !== 'complete' || !pendingEmail) {
          return fail(clerkError('sign_in_not_complete'))
        }
        activate(pendingEmail)
        return ok
      },
      async reset() {
        signIn.status = 'needs_identifier'
        pendingEmail = null
        return ok
      },
    }
    return signIn
  }

  return clerk
}

export type FakeClerk = ReturnType<typeof createFakeClerk>

/** The one fake behind the mocked `@clerk/expo` (jest.setup.ts); reset before each test. */
export const fakeClerk = createFakeClerk()

/** What `jest.mock('@clerk/expo')` answers with. */
export const fakeClerkModule = {
  getClerkInstance: () => fakeClerk,
  useSignIn: () => ({ signIn: fakeClerk.signIn, errors: {}, fetchStatus: 'idle' }),
  useSSO: () => ({
    async startSSOFlow(_params: { strategy: string; redirectUrl?: string }) {
      const email = fakeClerk.ssoEmail
      if (email === null) return { createdSessionId: null, authSessionResult: null }
      fakeClerk.addAccount(email, `sso-${email}`)
      return {
        createdSessionId: 'sso-pending',
        authSessionResult: null,
        setActive: async () => fakeClerk.restore(email),
      }
    },
  }),
  ClerkProvider: ({ children }: { children: ReactNode }) => children,
}
