import { identity as clerkIdentity, useSession, type Identity } from '@/shared/session'

import { authRepository, type AuthRepository } from './api'

type Dependencies = { repository?: AuthRepository; identity?: Identity }

/** Signs out of a Clerk session left behind (offline "Sair", or an unfinished sign-in). */
export async function clearStaleIdentity({ identity = clerkIdentity }: Dependencies = {}) {
  if (identity.sessionId()) await identity.signOut()
}

/**
 * The last step of every sign-in, once Clerk has an active session: reads the local User and
 * opens a Live session. If the API refuses (not invited, deactivated, offline), signs out of Clerk
 * so nothing is left half signed-in, and rethrows for the screen to say why.
 */
export async function openLiveSession({
  repository = authRepository,
  identity = clerkIdentity,
}: Dependencies = {}) {
  const id = identity.sessionId()
  try {
    if (!id) throw new Error('Clerk has no active session after signing in.')
    useSession.getState().signIn({ id, user: await repository.me(), live: true })
  } catch (error) {
    await identity.signOut().catch(() => {})
    throw error
  }
}
