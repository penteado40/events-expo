import type { GroupRole } from '../group-role'
import { groupPermissions } from '../permissions'

describe('groupPermissions', () => {
  it.each<[GroupRole, boolean]>([
    ['OWNER', true],
    ['VIEWER', false],
    ['SUPER_ADMIN', true],
  ])('%s manages people and Teams: %p', (role, manages) => {
    expect(groupPermissions(role)).toEqual({ managesPeople: manages, managesTeams: manages })
  })
})
