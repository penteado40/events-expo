import { NAME_MAX, NAME_TOO_LONG, nameProblem } from '../person-name'

describe('nameProblem', () => {
  it("says an empty name is missing, in the form's own words", () => {
    expect(nameProblem('', 'Informe o nome.')).toBe('Informe o nome.')
    expect(nameProblem('', 'Informe seu nome.')).toBe('Informe seu nome.')
  })

  it('takes a name up to the limit and refuses a longer one', () => {
    expect(nameProblem('a'.repeat(NAME_MAX), 'Informe o nome.')).toBeNull()
    expect(nameProblem('a'.repeat(NAME_MAX + 1), 'Informe o nome.')).toBe(NAME_TOO_LONG)
  })
})
