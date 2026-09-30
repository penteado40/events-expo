export const CONTRIBUTION_STATUSES = [
  'PENDING',
  'ABANDONED',
  'PAID',
  'VERIFIED',
  'REJECTED',
] as const

export type ContributionStatus = (typeof CONTRIBUTION_STATUSES)[number]

/** The "Verificado" stat: the amount of the VERIFIED Contributions, summed in centavos. */
export function verifiedAmount(
  contributions: readonly { amount: number; status: ContributionStatus }[],
) {
  const centavos = contributions
    .filter((c) => c.status === 'VERIFIED')
    .reduce((total, c) => total + Math.round(c.amount * 100), 0)
  return centavos / 100
}
