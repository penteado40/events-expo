import type { GroupMember, Participant, Team } from '../api'
import { participantsList } from '../participants-list'

const member = (userId: number, name: string, role: 'OWNER' | 'VIEWER' = 'VIEWER') => ({
  userId,
  name,
  email: `${userId}@example.com`,
  phone: `+55279999900${userId}`,
  role,
  isPending: false,
})

// Vocal Livre, as in the Manaus scenario.
const MEMBERS: GroupMember[] = [
  member(2, 'Bruno Reis', 'OWNER'),
  member(3, 'Matias Costa'),
  member(4, 'Jacque Moreira'),
  member(5, 'Lu Andrade'),
  { ...member(9, 'Tiago Souza'), isPending: true },
]
const TEAMS: Team[] = [
  { id: 5, name: 'Banda', memberIds: [3] },
  { id: 4, name: 'Cantores', memberIds: [4, 5] },
  { id: 2, name: 'Produção', memberIds: [2] },
  { id: 6, name: 'Técnica', memberIds: [3] },
]
const going = (...ids: number[]): Participant[] =>
  ids.map((userId) => {
    const { name, phone, role } = MEMBERS.find((m) => m.userId === userId)!
    return { userId, name, phone, role }
  })

describe('participantsList', () => {
  it('lists the whole Group by name for who edits, each marked going or not', () => {
    const list = participantsList(MEMBERS, TEAMS, going(2, 4, 5), { editable: true })

    expect(list.rows.map((r) => [r.name, r.going])).toEqual([
      ['Bruno Reis', true],
      ['Jacque Moreira', true],
      ['Lu Andrade', true],
      ['Matias Costa', false],
      ['Tiago Souza', false],
    ])
  })

  it("says each person's Teams, the Owner, and who is not going", () => {
    const list = participantsList(MEMBERS, TEAMS, going(2, 4, 5), { editable: true })
    const detail = (name: string) => list.rows.find((r) => r.name === name)?.detail

    expect(detail('Bruno Reis')).toBe('Produção · Owner')
    expect(detail('Lu Andrade')).toBe('Cantores')
    expect(detail('Matias Costa')).toBe('Banda, Técnica · não vai')
    expect(detail('Tiago Souza')).toBe('não vai')
  })

  it('counts who goes out of the Group: "3 de 5"', () => {
    const list = participantsList(MEMBERS, TEAMS, going(2, 4, 5), { editable: true })

    expect(list.count).toEqual({ going: 3, group: 5 })
  })

  it('shows only who goes to someone who only reads', () => {
    const list = participantsList(MEMBERS, TEAMS, going(2, 4, 5), { editable: false })

    expect(list.rows.map((r) => r.name)).toEqual(['Bruno Reis', 'Jacque Moreira', 'Lu Andrade'])
    expect(list.rows.find((r) => r.name === 'Bruno Reis')?.detail).toBe('Produção · Owner')
  })

  it('offers a shortcut per Team with whom it would add, none once all are going', () => {
    const list = participantsList(MEMBERS, TEAMS, going(2, 4), { editable: true })

    expect(list.shortcuts).toEqual([
      { id: 5, name: 'Banda', going: 0, total: 1, missing: [3] },
      { id: 4, name: 'Cantores', going: 1, total: 2, missing: [5] },
      { id: 2, name: 'Produção', going: 1, total: 1, missing: [] },
      { id: 6, name: 'Técnica', going: 0, total: 1, missing: [3] },
    ])
  })

  it('leaves out of a shortcut someone a Team names who is no longer in the Group', () => {
    const teams = [{ id: 4, name: 'Cantores', memberIds: [4, 5, 6] }]

    const list = participantsList(MEMBERS, teams, going(4), { editable: true })

    expect(list.shortcuts).toEqual([{ id: 4, name: 'Cantores', going: 1, total: 2, missing: [5] }])
  })

  it('still lists a Participant who is no longer a Group member', () => {
    const outsider: Participant = { userId: 6, name: 'Carla Dias', phone: '+55', role: 'VIEWER' }

    const list = participantsList(MEMBERS, TEAMS, [...going(2), outsider], { editable: true })

    expect(list.rows.find((r) => r.userId === 6)).toMatchObject({ going: true, detail: '' })
    expect(list.count).toEqual({ going: 2, group: 5 })
  })
})
