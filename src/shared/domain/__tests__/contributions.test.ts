import { verifiedAmount, type ContributionStatus } from '../contributions'

const c = (amount: number, status: ContributionStatus) => ({ amount, status })

describe('verifiedAmount', () => {
  it('sums only the VERIFIED Contributions', () => {
    expect(
      verifiedAmount([
        c(450, 'PAID'),
        c(200, 'VERIFIED'),
        c(890, 'VERIFIED'),
        c(450, 'REJECTED'),
        c(100, 'PENDING'),
        c(75, 'ABANDONED'),
      ]),
    ).toBe(1090)
  })

  it('keeps centavos exact', () => {
    expect(verifiedAmount([c(0.1, 'VERIFIED'), c(0.2, 'VERIFIED')])).toBe(0.3)
  })

  it('is zero with nothing verified', () => {
    expect(verifiedAmount([])).toBe(0)
    expect(verifiedAmount([c(180, 'PAID')])).toBe(0)
  })
})
