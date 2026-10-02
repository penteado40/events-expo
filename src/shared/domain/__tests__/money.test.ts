import { formatMoney, sumMoney } from '../money'

// Intl separates "R$" from the amount with a no-break space.
const nbsp = (text: string) => text.replace(/ /g, ' ')

describe('formatMoney', () => {
  it.each<[number, string]>([
    [0, 'R$ 0,00'],
    [200, 'R$ 200,00'],
    [1090, 'R$ 1.090,00'],
    [1090.5, 'R$ 1.090,50'],
    [12345.67, 'R$ 12.345,67'],
  ])('%d BRL → %s', (amount, expected) => {
    expect(formatMoney(amount, 'BRL')).toBe(nbsp(expected))
  })

  it('uses the Event’s currency', () => {
    expect(formatMoney(50, 'USD')).toBe(nbsp('US$ 50,00'))
  })
})

describe('sumMoney', () => {
  it('adds up in centavos, so 0.1 + 0.2 is 0.3', () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3)
  })

  it('takes amounts out, too', () => {
    expect(sumMoney([650, -450])).toBe(200)
  })

  it('is zero with nothing to add', () => {
    expect(sumMoney([])).toBe(0)
  })
})
