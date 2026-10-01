import { contributionCountLabel } from '../contribution-count-label'

describe('contributionCountLabel', () => {
  it.each([
    [0, 'nenhuma contribuição'],
    [1, '1 contribuição'],
    [2, '2 contribuições'],
    [11, '11 contribuições'],
  ])('%i → %s', (count, expected) => {
    expect(contributionCountLabel(count)).toBe(expected)
  })
})
