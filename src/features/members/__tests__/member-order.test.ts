import { sortMembers } from '../member-order'
import type { EventMember } from '../schemas'

const m = (name: string, role: EventMember['role'], isPrimaryOwner = false): EventMember => ({
  userId: 0,
  name,
  role,
  isPrimaryOwner,
})

describe('sortMembers', () => {
  it('puts the Primary owner first, then Owners, Managers and Viewers, by name in each', () => {
    const members = [
      m('Pedro Souza', 'VIEWER'),
      m('Rafael Souza', 'OWNER'),
      m('Otávio Kern', 'MANAGER'),
      m('Cláudia Lima', 'OWNER'),
      m('Ana Lima', 'VIEWER'),
      m('Zeca Prado', 'OWNER', true),
    ]

    expect(sortMembers(members).map((member) => member.name)).toEqual([
      'Zeca Prado',
      'Cláudia Lima',
      'Rafael Souza',
      'Otávio Kern',
      'Ana Lima',
      'Pedro Souza',
    ])
  })

  it('orders names as pt-BR does, accents and case aside', () => {
    const members = [m('Óscar', 'VIEWER'), m('beatriz', 'VIEWER'), m('Olga', 'VIEWER')]

    expect(sortMembers(members).map((member) => member.name)).toEqual(['beatriz', 'Olga', 'Óscar'])
  })
})
