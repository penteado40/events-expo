import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import type { StoreApi, UseBoundStore } from 'zustand'

import { createSessionStore, type Session } from '../session-store'

const admin: Session = {
  id: 'demo-1',
  live: false,
  user: {
    id: 1,
    name: 'Admin Local',
    email: 'admin@local.test',
    phone: '+5527999990001',
    isSuperAdmin: true,
    memberships: [],
  },
}

/** Renders a store hook and waits until it has loaded from SecureStore, like the splash does. */
async function open<T extends { hydrated: boolean }>(useStore: UseBoundStore<StoreApi<T>>) {
  const hook = await renderHook(() => useStore())
  await waitFor(() => expect(hook.result.current.hydrated).toBe(true))
  return hook.result
}

describe('Session store', () => {
  it('restores the Session when the app is reopened', async () => {
    const first = await open(createSessionStore())
    await act(() => first.current.signIn(admin))

    const reopened = await open(createSessionStore())

    expect(reopened.current.session).toEqual(admin)
  })

  it('signs out, also after reopening', async () => {
    const session = await open(createSessionStore())
    await act(() => session.current.signIn(admin))

    await act(() => session.current.signOut())

    const reopened = await open(createSessionStore())
    expect(reopened.current.session).toBeNull()
  })

  it('drops a stored Session without an API behind it when reopened in a release build', async () => {
    const dev = await open(createSessionStore({ isDev: true }))
    await act(() => dev.current.signIn(admin))

    const release = await open(createSessionStore({ isDev: false }))

    expect(release.current.session).toBeNull()
  })

  it('keeps a stored live Session in a release build', async () => {
    const live: Session = { ...admin, id: 'sess_1', live: true }
    const dev = await open(createSessionStore({ isDev: true }))
    await act(() => dev.current.signIn(live))

    const release = await open(createSessionStore({ isDev: false }))

    expect(release.current.session).toEqual(live)
  })

  it('expires the Session refused by the API, but not a newer one', async () => {
    const session = await open(createSessionStore())
    await act(() => session.current.signIn({ ...admin, id: 'new' }))

    await act(() => session.current.expire('old', 'UNAUTHENTICATED'))
    expect(session.current.session).toMatchObject({ id: 'new' })
    await act(() => session.current.expire(null, 'UNAUTHENTICATED'))
    expect(session.current.session).toMatchObject({ id: 'new' })

    await act(() => session.current.expire('new', 'USER_DEACTIVATED'))
    expect(session.current.session).toBeNull()
    expect(session.current.endedBecause).toBe('USER_DEACTIVATED')
  })

  it('forgets why the last Session ended on the next sign-in and on reopening', async () => {
    const session = await open(createSessionStore())
    await act(() => session.current.signIn(admin))
    await act(() => session.current.expire(admin.id, 'UNAUTHENTICATED'))

    const reopened = await open(createSessionStore())
    expect(reopened.current.endedBecause).toBeNull()

    await act(() => session.current.signIn(admin))
    expect(session.current.endedBecause).toBeNull()
  })

  it('ends a Session for "Sair" without a reason to show', async () => {
    const session = await open(createSessionStore())
    await act(() => session.current.signIn(admin))

    await act(() => session.current.signOut())

    expect(session.current.endedBecause).toBeNull()
  })

  it('refreshes the stored User only while the same Session is open', async () => {
    const session = await open(createSessionStore())
    await act(() => session.current.signIn(admin))
    const renamed = { ...admin.user, name: 'Admin Renomeado' }

    await act(() => session.current.updateUser('other-session', renamed))
    expect(session.current.session?.user.name).toBe('Admin Local')

    await act(() => session.current.updateUser(admin.id, renamed))
    expect(session.current.session).toEqual({ ...admin, user: renamed })
  })

  it.each([
    ['malformed', { id: 'x', user: { id: 'nope' } }],
    [
      'from V1, with its own token',
      {
        token: 'mock-token-1',
        live: true,
        user: { id: 1, name: 'A', email: 'a@local.test', role: 'SUPER_ADMIN' },
      },
    ],
  ])('starts signed out when the stored Session is %s', async (_, stored) => {
    await SecureStore.setItemAsync(
      'session',
      JSON.stringify({ state: { session: stored }, version: 0 }),
    )

    const reopened = await open(createSessionStore())

    expect(reopened.current.session).toBeNull()
  })
})
