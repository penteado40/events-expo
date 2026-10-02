import { isViewer, memberRoleLabel, platformRoleLabel, roleLabel, type Membership } from '../roles'

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

describe('memberRoleLabel', () => {
  it.each<[Membership, string]>([
    [{ role: 'OWNER', isPrimaryOwner: true }, 'Owner · principal'],
    [{ role: 'OWNER', isPrimaryOwner: false }, 'Owner'],
    [{ role: 'MANAGER', isPrimaryOwner: false }, 'Manager'],
    [{ role: 'VIEWER', isPrimaryOwner: false }, 'Viewer'],
  ])('%j → %s', (member, expected) => {
    expect(memberRoleLabel(member)).toBe(expected)
  })
})

describe('platformRoleLabel', () => {
  it('names the Super admin and nobody else', () => {
    expect(platformRoleLabel('SUPER_ADMIN')).toBe('Super admin')
    expect(platformRoleLabel('USER')).toBeNull()
  })
})

describe('isViewer', () => {
  it.each<[Membership | null, boolean]>([
    [{ role: 'VIEWER', isPrimaryOwner: false }, true],
    [{ role: 'MANAGER', isPrimaryOwner: false }, false],
    [{ role: 'OWNER', isPrimaryOwner: true }, false],
    [null, false],
  ])('%j → %s', (membership, expected) => {
    expect(isViewer(membership)).toBe(expected)
  })
})
