import type { User } from '@/shared/session'

import { resolveCurrentGroup } from '../current-group'

const vocalLivre = { id: 1, name: 'Vocal Livre' }
const coral = { id: 2, name: 'Coral Jovem Vitória' }
const groups = [coral, vocalLivre]

const lu: User = {
  id: 5,
  name: 'Lu Andrade',
  email: 'lu.andrade@example.com',
  phone: '+5527999990005',
  isSuperAdmin: false,
  memberships: [
    { groupId: 1, groupName: 'Vocal Livre', role: 'VIEWER' },
    { groupId: 2, groupName: 'Coral Jovem Vitória', role: 'OWNER' },
  ],
}
const admin: User = { ...lu, id: 1, isSuperAdmin: true, memberships: [] }

describe('resolveCurrentGroup', () => {
  it('is the Group the person chose, with their role there', () => {
    expect(resolveCurrentGroup(groups, 1, lu)).toEqual({ ...vocalLivre, role: 'VIEWER' })
    expect(resolveCurrentGroup(groups, 2, lu)).toEqual({ ...coral, role: 'OWNER' })
  })

  it('is the first Group when nothing was chosen yet', () => {
    expect(resolveCurrentGroup(groups, null, lu)).toEqual({ ...coral, role: 'OWNER' })
  })

  it('falls back to the first Group when the chosen one is no longer listed', () => {
    expect(resolveCurrentGroup([vocalLivre], 2, lu)).toEqual({ ...vocalLivre, role: 'VIEWER' })
  })

  it('is none when the person is in no Group', () => {
    expect(resolveCurrentGroup([], 1, lu)).toBeNull()
  })

  it('makes the Super admin the Super admin in any Group', () => {
    expect(resolveCurrentGroup(groups, 1, admin)).toEqual({ ...vocalLivre, role: 'SUPER_ADMIN' })
  })

  it('takes a Group the Membership does not know yet (added since) as Viewer', () => {
    const before = { ...lu, memberships: [] }

    expect(resolveCurrentGroup(groups, 1, before)?.role).toBe('VIEWER')
  })
})
