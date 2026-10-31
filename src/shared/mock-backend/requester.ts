import { useSession } from '@/shared/session'

import type { VerifiedIdentity } from './backend'

/** Gives the email of whoever is asking, as Clerk verified it; null when signed out. */
export type GetEmail = () => Promise<string | null>

/**
 * The Session's User, as a feature's mock asks the backend: the mock stands in for the API, which
 * knows the requester from Clerk's token, so it uses the same email in Demo mode and in a Live
 * session.
 */
export const sessionEmail: GetEmail = async () => useSession.getState().session?.user.email ?? null

/** The verified identity the backend's calls take. */
export async function identityOf(getEmail: GetEmail): Promise<VerifiedIdentity | null> {
  const email = await getEmail()
  return email === null ? null : { email }
}
