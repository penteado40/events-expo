import { platformRoleLabel, roleLabel, type Membership } from '../roles'

describe('roleLabel', () => {
  it.each<[Membership | null, string]>([
    [{ role: 'OWNER', isPrimaryOwner: false }, 'Owner'],
    [{ role: 'OWNER', isPrimaryOwner: true }, 'Owner · principal'],
    [{ role: 'MANAGER', isPrimaryOwner: false }, 'Manager'],
    [{ role: 'VIEWER', isPrimaryOwner: false }, 'Viewer'],
    // The API sends no Membership only to the Super admin, who is never an Event member.
    [null, 'Super admin'],
  ])('%j → %s', (membership, expected) => {
    expect(roleLabel(membership)).toBe(expected)
  })
})

describe('platformRoleLabel', () => {
  it('names the Super admin and nobody else', () => {
    expect(platformRoleLabel('SUPER_ADMIN')).toBe('Super admin')
    expect(platformRoleLabel('USER')).toBeNull()
  })
})
