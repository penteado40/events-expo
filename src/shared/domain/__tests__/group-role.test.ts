import type { User } from '@/shared/session'

import {
  canCreateEvent,
  canEditEvent,
  isGroupMember,
  roleIn,
  seesDrafts,
  type GroupRole,
} from '../group-role'

describe('group roles', () => {
  it.each<[GroupRole, boolean, boolean]>([
    ['OWNER', true, true],
    ['VIEWER', false, true],
    ['SUPER_ADMIN', true, false],
  ])('%s: sees Drafts %p, Group member %p', (role, drafts, member) => {
    expect(seesDrafts(role)).toBe(drafts)
    expect(isGroupMember(role)).toBe(member)
  })
})

describe('roleIn', () => {
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

  it("is the person's role in that Group, from the Membership", () => {
    expect(roleIn(lu, 1)).toBe('VIEWER')
    expect(roleIn(lu, 2)).toBe('OWNER')
  })

  it('counts a Group the Membership does not know yet as Viewer, the least', () => {
    expect(roleIn(lu, 9)).toBe('VIEWER')
  })

  it('is Super admin in every Group for the Super admin', () => {
    expect(roleIn({ ...lu, isSuperAdmin: true, memberships: [] }, 1)).toBe('SUPER_ADMIN')
  })
})

describe('Event permissions', () => {
  it.each<[GroupRole, boolean]>([
    ['OWNER', true],
    ['SUPER_ADMIN', true],
    ['VIEWER', false],
  ])('%s creates Events: %p', (role, can) => {
    expect(canCreateEvent(role)).toBe(can)
  })

  it.each<[GroupRole, { cancelled: boolean; state: 'DRAFT' | 'PUBLISHED' }, boolean]>([
    ['OWNER', { cancelled: false, state: 'DRAFT' }, true],
    ['SUPER_ADMIN', { cancelled: false, state: 'DRAFT' }, true],
    ['VIEWER', { cancelled: false, state: 'DRAFT' }, false],
    // A Cancelled Event stays frozen, items and all, until un-cancelled.
    ['OWNER', { cancelled: true, state: 'DRAFT' }, false],
    // In a published Event too: there an item is born in Draft, with Publicar.
    ['OWNER', { cancelled: false, state: 'PUBLISHED' }, true],
    ['SUPER_ADMIN', { cancelled: false, state: 'PUBLISHED' }, true],
    ['VIEWER', { cancelled: false, state: 'PUBLISHED' }, false],
    ['OWNER', { cancelled: true, state: 'PUBLISHED' }, false],
  ])('%s edits an Event %o and its items: %p', (role, event, can) => {
    expect(canEditEvent(role, event)).toBe(can)
  })
})
