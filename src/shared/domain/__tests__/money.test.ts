import { formatMoney, formatWholeMoney } from '../money'

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

describe('formatWholeMoney', () => {
  it.each<[number, string]>([
    [0, 'R$ 0'],
    [1090, 'R$ 1.090'],
    // Rounded down: never more than was verified.
    [1090.99, 'R$ 1.090'],
    [123456.5, 'R$ 123.456'],
  ])('%d BRL → %s', (amount, expected) => {
    expect(formatWholeMoney(amount, 'BRL')).toBe(nbsp(expected))
  })
})
