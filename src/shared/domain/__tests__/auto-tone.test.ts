import { AUTO_TONES, autoTone } from '../auto-tone'

describe('autoTone', () => {
  it('gives the six categorical tones in turn, from id 1', () => {
    expect([1, 2, 3, 4, 5, 6].map(autoTone)).toEqual([
      'coral',
      'green',
      'purple',
      'pink',
      'turquoise',
      'gold',
    ])
  })

  it('starts over after the sixth, so neighbouring ids never share a tone', () => {
    expect(autoTone(7)).toBe('coral')
    expect(autoTone(12)).toBe('gold')
    expect(autoTone(1005)).toBe(autoTone(3))
  })

  it('is stable: the same id always gets the same tone', () => {
    expect(autoTone(42)).toBe(autoTone(42))
  })

  it.each([0, -1, -7, 2 ** 31])('gives a categorical tone even for the odd id %p', (id) => {
    expect(AUTO_TONES).toContain(autoTone(id))
  })

  it('never gives the brand blue, Cancelled red or gray', () => {
    const tones = Array.from({ length: 60 }, (_, i) => autoTone(i - 10))

    expect(tones).not.toContain('blue')
    expect(tones).not.toContain('red')
    expect(tones).not.toContain('gray')
  })
})
