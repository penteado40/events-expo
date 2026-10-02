import type { ContributionStatus } from '@/shared/domain/contributions'
import { colors } from '@/shared/theme'

/**
 * How Conferir and the sheet show a Contribution's status. Only `PAID`, `VERIFIED` and `REJECTED`
 * reach the members; the other two get a muted label just in case.
 */
const STATUS: Record<ContributionStatus, { label: string; color: string }> = {
  PAID: { label: '● pendente', color: colors.accent },
  VERIFIED: { label: '● verificada', color: colors.verified },
  REJECTED: { label: '● rejeitada', color: colors.danger },
  PENDING: { label: '● aberta', color: colors.textMuted },
  ABANDONED: { label: '● abandonada', color: colors.textMuted },
}

export const contributionStatus = (status: ContributionStatus) => STATUS[status]
