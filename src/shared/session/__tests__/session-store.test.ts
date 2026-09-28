import { act, renderHook, waitFor } from '@testing-library/react-native'
import * as SecureStore from 'expo-secure-store'
import type { StoreApi, UseBoundStore } from 'zustand'

import { createLastEmailStore } from '../last-email-store'
import { createSessionStore, type Session } from '../session-store'

const admin: Session = {
  token: 'mock-token-1',
  live: false,
  user: {
    id: 1,
    name: 'Admin Local',
    email: 'admin@local.test',
    role: 'SUPER_ADMIN',
    createdAt: '2026-01-01T12:00:00.000Z',
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

  it('signs out without forgetting the saved email, even after reopening', async () => {
    const session = await open(createSessionStore())
    const lastEmail = await open(createLastEmailStore())
    await act(() => {
      session.current.signIn(admin)
      lastEmail.current.setEmail('admin@local.test')
    })

    await act(() => session.current.signOut())

    const reopenedSession = await open(createSessionStore())
    const reopenedEmail = await open(createLastEmailStore())
    expect(reopenedSession.current.session).toBeNull()
    expect(reopenedEmail.current.email).toBe('admin@local.test')
  })

  it('drops a stored Session without an API behind it when reopened in a release build', async () => {
    const dev = await open(createSessionStore({ isDev: true }))
    await act(() => dev.current.signIn(admin))

    const release = await open(createSessionStore({ isDev: false }))

    expect(release.current.session).toBeNull()
  })

  it('keeps a stored live Session in a release build', async () => {
    const live: Session = { ...admin, token: 'jwt', live: true }
    const dev = await open(createSessionStore({ isDev: true }))
    await act(() => dev.current.signIn(live))

    const release = await open(createSessionStore({ isDev: false }))

    expect(release.current.session).toEqual(live)
  })

  it('starts signed out when the stored Session is malformed', async () => {
    await SecureStore.setItemAsync(
      'session',
      JSON.stringify({ state: { session: { token: 'x', user: { id: 'nope' } } }, version: 0 }),
    )

    const reopened = await open(createSessionStore())

    expect(reopened.current.session).toBeNull()
  })
})
