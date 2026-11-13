import { peopleSections } from '../people-sections'
import type { Person } from '../people-and-teams'

const member = (name: string, role: Person['role']): Person => ({
  userId: name.length,
  name,
  email: 'x@example.com',
  phone: '+5527999990000',
  role,
  isPending: false,
  teams: [],
})

const bruno = member('Bruno Reis', 'OWNER')
const lu = member('Lu Andrade', 'VIEWER')
const alice = member('Alice Moura', 'VIEWER')
const joao = member('João Lima', 'VIEWER')

describe('peopleSections', () => {
  it('separates Owners from Viewers, each by name', () => {
    expect(peopleSections([lu, bruno, alice], '')).toEqual([
      { title: 'OWNERS · A PRODUÇÃO', members: [bruno] },
      { title: 'VIEWERS', members: [alice, lu] },
    ])
  })

  it('finds a person by name, ignoring case and accents', () => {
    expect(peopleSections([bruno, joao, lu], ' joao ')).toEqual([
      { title: 'VIEWERS', members: [joao] },
    ])
  })

  it('leaves out a section with nobody in it', () => {
    expect(peopleSections([lu, bruno], 'bruno')).toEqual([
      { title: 'OWNERS · A PRODUÇÃO', members: [bruno] },
    ])
  })
})
