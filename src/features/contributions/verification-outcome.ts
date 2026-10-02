import type { VerificationOutcome } from '@/shared/domain/contributions'

import type { ContributionsRepository } from './repository'

type OutcomeCopy = {
  /** The repository call that records it. */
  call: keyof Pick<ContributionsRepository, 'verify' | 'reject'>
  /** "Não foi possível {verb} a contribuição #N." */
  verb: string
  /** The sheet's link to revise a decided Contribution to this outcome. */
  revision: string
}

/** Each Verification outcome: how it's recorded and how the screens name it. */
export const VERIFICATION_OUTCOMES: Record<VerificationOutcome, OutcomeCopy> = {
  VERIFIED: { call: 'verify', verb: 'verificar', revision: 'rever · marcar como verificada' },
  REJECTED: { call: 'reject', verb: 'rejeitar', revision: 'rever · marcar como rejeitada' },
}
