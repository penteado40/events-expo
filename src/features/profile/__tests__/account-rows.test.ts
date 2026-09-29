import type { User } from '@/shared/session'

import { accountRows } from '../account-rows'

const superAdmin: User = {
  id: 2,
  name: 'Felipe Penteado',
  email: 'flpenteado@gmail.com',
  role: 'SUPER_ADMIN',
  createdAt: '2026-09-28T13:17:50.248Z',
}

describe('accountRows', () => {
  it('shows a Super admin their email, role and when they joined', () => {
    expect(accountRows(superAdmin)).toEqual([
      { label: 'Email', value: 'flpenteado@gmail.com' },
      { label: 'Papel', value: 'Super admin' },
      { label: 'Membro desde', value: '28 de set. de 2026' },
    ])
  })

  it('has no role row for a User, whose roles live in each Event', () => {
    const user: User = { ...superAdmin, role: 'USER', createdAt: '2026-01-05T12:00:00.000Z' }

    expect(accountRows(user)).toEqual([
      { label: 'Email', value: 'flpenteado@gmail.com' },
      { label: 'Membro desde', value: '5 de jan. de 2026' },
    ])
  })
})
