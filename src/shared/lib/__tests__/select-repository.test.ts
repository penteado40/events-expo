import { useSession, type Session } from '@/shared/session'

import type { DataModule } from '../live-modules'
import { selectRepository } from '../select-repository'

type Repository = { whoAmI(greeting: string): Promise<string> }

const implementations = {
  http: { whoAmI: async (greeting: string) => `${greeting}, HTTP` },
  mock: { whoAmI: async (greeting: string) => `${greeting}, mock` },
}

const session = (live: boolean): Session => ({
  id: 'sess_1',
  live,
  user: {
    id: 1,
    name: 'Admin Local',
    email: 'admin@local.test',
    phone: '+5527999990001',
    isSuperAdmin: true,
    memberships: [],
  },
})

beforeEach(() => useSession.setState({ session: null }))

describe('selectRepository', () => {
  it.each<[string, Session | null, DataModule[], boolean, 'HTTP' | 'mock']>([
    ['Demo mode', session(false), ['auth'], true, 'mock'],
    ['Demo mode, module not live', session(false), [], true, 'mock'],
    ['Live session, module live', session(true), ['auth'], true, 'HTTP'],
    ['Live session, module not live', session(true), [], true, 'mock'],
    ['no Session yet, module live', null, ['auth'], true, 'HTTP'],
    ['no Session yet, module not live', null, [], true, 'mock'],
    ['release build, Demo mode', session(false), [], false, 'HTTP'],
    ['release build, module not live', session(true), [], false, 'HTTP'],
  ])('%s → %s', async (_, current, liveModules, isDev, expected) => {
    useSession.setState({ session: current })
    const repository: Repository = selectRepository('auth', implementations, {
      isDev,
      liveModules,
    })

    await expect(repository.whoAmI('oi')).resolves.toBe(`oi, ${expected}`)
  })

  it('decides on every call, so a new Session switches the implementation', async () => {
    const repository: Repository = selectRepository('auth', implementations, {
      isDev: true,
      liveModules: ['auth'],
    })

    useSession.setState({ session: session(true) })
    await expect(repository.whoAmI('oi')).resolves.toBe('oi, HTTP')
    useSession.setState({ session: session(false) })
    await expect(repository.whoAmI('oi')).resolves.toBe('oi, mock')
  })
})
