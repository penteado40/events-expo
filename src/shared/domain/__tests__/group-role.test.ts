import { isGroupMember, seesDrafts, type GroupRole } from '../group-role'

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
