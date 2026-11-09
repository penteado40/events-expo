import { joinPeopleAndTeams } from '../people-and-teams'
import type { GroupMember, Team } from '../schemas'

const member = (userId: number, name: string): GroupMember => ({
  userId,
  name,
  email: `${userId}@example.com`,
  phone: '+5527999990000',
  role: 'VIEWER',
  isPending: false,
})

const matias = member(3, 'Matias Costa')
const jacque = member(4, 'Jacque Moreira')
const tiago = member(9, 'Tiago Souza')

// As the API lists them: by name.
const banda: Team = { id: 5, name: 'Banda', memberIds: [3] }
const cantores: Team = { id: 4, name: 'Cantores', memberIds: [4] }
const tecnica: Team = { id: 6, name: 'Técnica', memberIds: [3] }

describe('joinPeopleAndTeams', () => {
  it("gives each person their Teams in the API's name order, the first one leading", () => {
    const { people } = joinPeopleAndTeams([matias, jacque, tiago], [banda, cantores, tecnica])

    expect(people).toEqual([
      {
        ...matias,
        teams: [
          { id: 5, name: 'Banda' },
          { id: 6, name: 'Técnica' },
        ],
      },
      { ...jacque, teams: [{ id: 4, name: 'Cantores' }] },
      { ...tiago, teams: [] },
    ])
  })

  it('counts the people of each Team, keeping the order', () => {
    const { teams } = joinPeopleAndTeams([matias, jacque], [banda, cantores, tecnica])

    expect(teams).toEqual([
      { id: 5, name: 'Banda', memberCount: 1 },
      { id: 4, name: 'Cantores', memberCount: 1 },
      { id: 6, name: 'Técnica', memberCount: 1 },
    ])
  })

  it('leaves out of the count anyone no longer among the Group members', () => {
    const stale: Team = { id: 5, name: 'Banda', memberIds: [3, 42] }

    expect(joinPeopleAndTeams([matias], [stale]).teams).toEqual([
      { id: 5, name: 'Banda', memberCount: 1 },
    ])
  })

  it('works before the Teams arrive', () => {
    expect(joinPeopleAndTeams([matias], [])).toEqual({
      people: [{ ...matias, teams: [] }],
      teams: [],
    })
  })
})
