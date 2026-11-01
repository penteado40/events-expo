import { headerSnap } from '../header-snap'

describe('headerSnap', () => {
  it.each([
    [0, null],
    [-30, null],
    [80, null],
    [120, null],
    [10, 0],
    [39, 0],
    [40, 80],
    [70, 80],
  ])('settles a list at %p (fold of 80) at %p', (offset, target) => {
    expect(headerSnap(offset, 80)).toBe(target)
  })

  it('does nothing before the greeting is measured', () => {
    expect(headerSnap(10, 0)).toBeNull()
  })
})
