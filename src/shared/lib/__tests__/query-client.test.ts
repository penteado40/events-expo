import { expireSession, useSession, type Session } from '@/shared/session'

import { ApiError } from '../api-error'
import { clearCacheOnSignOut, createQueryClient, shouldRetry } from '../query-client'

describe('shouldRetry', () => {
  const error = (code: string) => new ApiError(code, 'x')

  it.each([
    ['NETWORK', 0, true],
    ['INTERNAL_ERROR', 0, true],
    ['NETWORK', 1, false],
    ['INTERNAL_ERROR', 1, false],
    ['UNAUTHENTICATED', 0, false],
    ['FORBIDDEN', 0, false],
    ['NOT_FOUND', 0, false],
    ['VALIDATION_ERROR', 0, false],
    ['USER_PENDING', 0, false],
  ])('%s after %i failed retries → %s', (code, failureCount, expected) => {
    expect(shouldRetry(failureCount, error(code))).toBe(expected)
  })

  it('does not retry an error that is not an ApiError', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(false)
  })
})

describe('clearCacheOnSignOut', () => {
  const session: Session = {
    id: 'sess_1',
    live: true,
    user: {
      id: 1,
      name: 'Admin Local',
      email: 'admin@local.test',
      phone: '+5527999990001',
      isSuperAdmin: true,
      memberships: [],
    },
  }

  it.each([
    ['"Sair"', () => useSession.getState().signOut()],
    ['expiry', () => expireSession('sess_1', 'UNAUTHENTICATED')],
  ])('drops every cached query on %s', (_, end) => {
    const client = createQueryClient()
    useSession.setState({ session })
    const unsubscribe = clearCacheOnSignOut(client)
    client.setQueryData(['events'], [1, 2, 3])

    end()

    expect(client.getQueryData(['events'])).toBeUndefined()
    unsubscribe()
  })
})
