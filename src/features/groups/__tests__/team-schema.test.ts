import { teamSchema } from '../schemas'

describe('teamSchema', () => {
  it('reads a Team as the API serves it before PROJ-183, with nobody in it yet', () => {
    const json = { id: 5, groupId: 1, name: 'Banda', createdAt: '2026-09-01T12:00:00.000Z' }

    expect(teamSchema.parse(json)).toEqual({ id: 5, name: 'Banda', memberIds: [] })
  })

  it("reads each Team's members by User id", () => {
    const json = { id: 4, name: 'Cantores', members: [{ userId: 4 }, { userId: 5 }] }

    expect(teamSchema.parse(json)).toEqual({ id: 4, name: 'Cantores', memberIds: [4, 5] })
  })
})
