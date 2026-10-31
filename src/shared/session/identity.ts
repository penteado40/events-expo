import { getClerkInstance } from '@clerk/expo'

/**
 * Who the person is to Clerk (events-api ADR-0020), seen from outside React: the HTTP client asks
 * it for the token on every request, and the app's Session ends it when it ends. Every read waits
 * for Clerk to load: at cold start the stored session is not there yet.
 */
export interface Identity {
  /** The Clerk session's current token, or null when signed out of Clerk. */
  getToken(): Promise<string | null>
  /** The id of the signed-in Clerk session, or null. */
  sessionId(): Promise<string | null>
  /** The signed-in Clerk user's verified email, as the API's AuthVerifier reads it. */
  email(): Promise<string | null>
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

/** The Clerk instance `<ClerkProvider>` created, once it has loaded. */
async function loadedClerk(): Promise<Clerk> {
  const clerk = getClerkInstance()
  await whenLoaded(clerk)
  return clerk
}

/** The Identity behind `<ClerkProvider>`. */
export const clerkIdentity: Identity = {
  getToken: async () => (await (await loadedClerk()).session?.getToken()) ?? null,
  sessionId: async () => (await loadedClerk()).session?.id ?? null,
  email: async () => (await loadedClerk()).user?.primaryEmailAddress?.emailAddress ?? null,
  signOut: () => getClerkInstance().signOut(),
}
