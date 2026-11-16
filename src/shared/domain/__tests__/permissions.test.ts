import type { GroupRole } from '../group-role'
import { eventPermissions, groupPermissions } from '../permissions'

describe('groupPermissions', () => {
  it.each<[GroupRole, boolean]>([
    ['OWNER', true],
    ['VIEWER', false],
    ['SUPER_ADMIN', true],
  ])('%s manages people and Teams: %p', (role, manages) => {
    expect(groupPermissions(role)).toEqual({ managesPeople: manages, managesTeams: manages })
  })
})

describe('eventPermissions', () => {
  type Who = 'Owner' | 'Viewer Participant' | 'Viewer não Participant' | 'Super admin'
  type State = 'Draft' | 'publicado' | 'Cancelled' | 'Finished'

  const people: Record<Who, [GroupRole, boolean | null]> = {
    Owner: ['OWNER', false],
    'Viewer Participant': ['VIEWER', true],
    'Viewer não Participant': ['VIEWER', false],
    'Super admin': ['SUPER_ADMIN', null],
  }
  // A Finished event is a published one whose end date has passed: nothing changes for it.
  const states: Record<State, { state: 'DRAFT' | 'PUBLISHED'; cancelled: boolean }> = {
    Draft: { state: 'DRAFT', cancelled: false },
    publicado: { state: 'PUBLISHED', cancelled: false },
    Cancelled: { state: 'PUBLISHED', cancelled: true },
    Finished: { state: 'PUBLISHED', cancelled: false },
  }

  // [edits the Event and its items, publishes, sees Drafts, sees the schedule]
  const table: [Who, State, boolean, boolean, boolean, boolean][] = [
    ['Owner', 'Draft', true, true, true, true],
    ['Owner', 'publicado', true, false, true, true],
    ['Owner', 'Cancelled', false, false, true, true],
    ['Owner', 'Finished', true, false, true, true],
    ['Super admin', 'Draft', true, true, true, true],
    ['Super admin', 'publicado', true, false, true, true],
    ['Super admin', 'Cancelled', false, false, true, true],
    ['Super admin', 'Finished', true, false, true, true],
    ['Viewer Participant', 'Draft', false, false, false, false],
    ['Viewer Participant', 'publicado', false, false, false, true],
    ['Viewer Participant', 'Cancelled', false, false, false, true],
    ['Viewer Participant', 'Finished', false, false, false, true],
    ['Viewer não Participant', 'Draft', false, false, false, false],
    ['Viewer não Participant', 'publicado', false, false, false, false],
    ['Viewer não Participant', 'Cancelled', false, false, false, false],
    ['Viewer não Participant', 'Finished', false, false, false, false],
  ]

  it.each(table)('%s × %s', (who, state, edits, publishes, seesDrafts, seesSchedule) => {
    const [role, isParticipant] = people[who]
    expect(eventPermissions(role, { ...states[state], isParticipant })).toEqual({
      editsEvent: edits,
      editsItems: edits,
      publishes,
      seesDrafts,
      seesSchedule,
    })
  })
})
