import { uniqueAscending } from '../user-ids'

describe('uniqueAscending', () => {
  it('keeps each id once, in ascending order', () => {
    expect(uniqueAscending([5, 3, 5, 10, 3])).toEqual([3, 5, 10])
  })

  it('answers an empty list for none', () => {
    expect(uniqueAscending([])).toEqual([])
  })
})
