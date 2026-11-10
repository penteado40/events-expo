import { firstName, initials } from '../initials'

describe('initials', () => {
  it.each([
    ['Lu Andrade', 'LA'],
    ['Vocal Livre', 'VL'],
    ['Coral Jovem Vitória', 'CJ'],
    ['Ícaro', 'ÍC'],
    ['  bruno   reis ', 'BR'],
    ['', ''],
  ])('%p → %p', (name, expected) => {
    expect(initials(name)).toBe(expected)
  })
})

describe('firstName', () => {
  it.each([
    ['Paula Lima', 'Paula'],
    ['  Tiago  Souza ', 'Tiago'],
    ['Lu', 'Lu'],
  ])('of "%s" is "%s"', (name, first) => {
    expect(firstName(name)).toBe(first)
  })
})
