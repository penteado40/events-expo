import { getClerkInstance } from '@clerk/expo'

/**
 * Who the person is to Clerk (events-api ADR-0020), seen from outside React: the HTTP client asks
 * it for the token on every request, and the app's Session ends it when it ends.
 */
export interface Identity {
  /** The Clerk session's current token, or null when signed out of Clerk. Waits for Clerk to load. */
  getToken(): Promise<string | null>
  /** The id of the signed-in Clerk session, or null. */
  sessionId(): string | null
  /** The signed-in Clerk user's verified email, as the API's AuthVerifier reads it. */
  email(): string | null
  signOut(): Promise<void>
}

type Clerk = ReturnType<typeof getClerkInstance>

/** Resolves once Clerk has loaded, or failed to (offline): never hangs a request. */
function whenLoaded(clerk: Clerk): Promise<void> {
  if (clerk.loaded) return Promise.resolve()
  return new Promise((resolve) => {
    const handler = (status: string) => {
      if (status === 'loading') return
      clerk.off('status', handler)
      resolve()
    }
    clerk.on('status', handler, { notify: true })
  })
}

/** The Identity behind `<ClerkProvider>`, which creates the instance this reads. */
export const clerkIdentity: Identity = {
  async getToken() {
    const clerk = getClerkInstance()
    await whenLoaded(clerk)
    return (await clerk.session?.getToken()) ?? null
  },
  sessionId: () => getClerkInstance().session?.id ?? null,
  email: () => getClerkInstance().user?.primaryEmailAddress?.emailAddress ?? null,
  signOut: () => getClerkInstance().signOut(),
}
