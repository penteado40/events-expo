import { initials } from '../initials'

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
