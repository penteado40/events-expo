import type { AudienceRow, EventItemRow, PeopleFieldRow } from '../data'
import { itemReaches } from '../item-reach'

/** Saída Manaus goes with Bruno (2), Matias (3), Jacque (4) and Lu (5); Tiago (9) stays home. */
const participantIds = [2, 3, 4, 5]
const carro: PeopleFieldRow = {
  id: 3,
  type: 'PEOPLE',
  name: 'Carro 1',
  highlight: true,
  personalNotesVisibility: 'PRIVATE',
  people: [
    { userId: 3, name: null, personalNote: null },
    { userId: null, name: 'Seu Raimundo', personalNote: null },
    // In the Field, but no longer going.
    { userId: 9, name: null, personalNote: null },
  ],
}

function itemFor(audience: AudienceRow, fields: EventItemRow['fields'] = []): EventItemRow {
  const at = '2026-10-20T12:00:00.000Z'
  return {
    id: 8,
    eventId: 3,
    name: 'Translado de volta',
    date: '2026-11-22',
    time: '00:40',
    place: null,
    state: 'PUBLISHED',
    fields,
    audience,
    createdAt: at,
    updatedAt: at,
    updatedById: 2,
  }
}

const reaches = (item: EventItemRow, userId: number, production = false) =>
  itemReaches(item, { participantIds }, { userId, production })

describe('itemReaches (the mock’s Audience rule)', () => {
  it('reaches every Participant with "Todos", and no one who is not going', () => {
    const item = itemFor({ kind: 'ALL' })

    expect(participantIds.map((id) => reaches(item, id))).toEqual([true, true, true, true])
    expect(reaches(item, 9)).toBe(false)
  })

  it('reaches the chosen, and no other Participant', () => {
    const item = itemFor({ kind: 'SELECTED', userIds: [5] })

    expect(reaches(item, 5)).toBe(true)
    expect(reaches(item, 4)).toBe(false)
  })

  it('reaches whoever is in a Field of people of the item too, while going', () => {
    const item = itemFor({ kind: 'SELECTED', userIds: [5] }, [carro])

    expect(reaches(item, 3)).toBe(true)
    expect(reaches(item, 9)).toBe(false)
  })

  it('always reaches the production, chosen or not, going or not', () => {
    const item = itemFor({ kind: 'SELECTED', userIds: [5] })

    expect(reaches(item, 2, true)).toBe(true)
    expect(reaches(item, 1, true)).toBe(true)
  })
})
