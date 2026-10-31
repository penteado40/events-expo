import { endIdentityWithSession, useSession, type Identity, type Session } from '..'
import { clerkIdentity } from '../identity'
import { fakeClerk, fakeTokenFor } from './fake-clerk'

const session = (live: boolean): Session => ({
  id: live ? 'sess_1' : 'demo-1',
  live,
  user: {
    id: 2,
    name: 'Bruno Reis',
    email: 'bruno@vocallivre.test',
    phone: '+5527999990002',
    isSuperAdmin: false,
    memberships: [{ groupId: 1, groupName: 'Vocal Livre', role: 'OWNER' }],
  },
})

describe('clerkIdentity', () => {
  it('answers for the signed-in Clerk session', async () => {
    fakeClerk.restore('bruno@vocallivre.test')

    await expect(clerkIdentity.getToken()).resolves.toBe(fakeTokenFor('bruno@vocallivre.test'))
    await expect(clerkIdentity.sessionId()).resolves.toBe('sess_1')
    await expect(clerkIdentity.email()).resolves.toBe('bruno@vocallivre.test')
  })

  it('has no token, session or email when signed out of Clerk', async () => {
    await expect(clerkIdentity.getToken()).resolves.toBeNull()
    await expect(clerkIdentity.sessionId()).resolves.toBeNull()
    await expect(clerkIdentity.email()).resolves.toBeNull()
  })

  it('waits for Clerk to restore the stored session at cold start', async () => {
    fakeClerk.restore('bruno@vocallivre.test')
    fakeClerk.startLoading()

    const email = clerkIdentity.email()
    fakeClerk.finishLoading()

    await expect(email).resolves.toBe('bruno@vocallivre.test')
  })
})

describe('endIdentityWithSession', () => {
  let signOut: jest.Mock
  let unsubscribe: () => void

  beforeEach(() => {
    signOut = jest.fn(async () => {})
    const identity: Identity = {
      getToken: async () => null,
      sessionId: async () => null,
      email: async () => null,
      signOut,
    }
    useSession.setState({ session: null })
    unsubscribe = endIdentityWithSession(identity)
  })

  afterEach(() => unsubscribe())

  it.each([
    ['"Sair"', () => useSession.getState().signOut()],
    ['expiry', () => useSession.getState().expire('sess_1', 'UNAUTHENTICATED')],
  ])('signs out of Clerk when a Live session ends by %s', (_, end) => {
    useSession.setState({ session: session(true) })

    end()

    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('leaves Clerk alone when Demo mode ends', () => {
    useSession.setState({ session: session(false) })

    useSession.getState().signOut()

    expect(signOut).not.toHaveBeenCalled()
  })

  it('swallows a Clerk sign-out that fails offline', async () => {
    signOut.mockRejectedValue(new Error('Network request failed'))
    useSession.setState({ session: session(true) })

    expect(() => useSession.getState().signOut()).not.toThrow()
    await Promise.resolve()
  })
})
