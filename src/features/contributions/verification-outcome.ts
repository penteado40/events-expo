import type { VerificationOutcome } from '@/shared/domain/contributions'

import type { ContributionsRepository } from './repository'

/** What a confirmation names: the Contribution, its Guest and its amount, already formatted. */
type Asked = { id: number; guestName: string; amount: string }

type OutcomeCopy = {
  /** The repository call that records it. */
  call: keyof Pick<ContributionsRepository, 'verify' | 'reject'>
  /** "Não foi possível {verb} a contribuição #N." */
  verb: string
  /** The sheet's button to revise a decided Contribution to this outcome. */
  revision: string
  /** The confirmation's button; rejecting accuses a Guest, so it reads as destructive. */
  confirm: { label: string; destructive: boolean }
  /** The confirmation's title and message, deciding a PAID one. */
  decideQuestion: (asked: Asked) => [string, string]
  /** The confirmation's title and message, revising a decided one. */
  reviseQuestion: (asked: Asked) => [string, string]
}

/** Each Verification outcome: how it's recorded, and how the screens name and confirm it. */
export const VERIFICATION_OUTCOMES: Record<VerificationOutcome, OutcomeCopy> = {
  VERIFIED: {
    call: 'verify',
    verb: 'verificar',
    revision: 'rever · marcar como verificada',
    confirm: { label: 'Verificar', destructive: false },
    decideQuestion: ({ id, guestName, amount }) => [
      `Verificar contribuição #${id}?`,
      `O Pix de ${amount} de ${guestName} chegou?`,
    ],
    reviseQuestion: ({ id }) => [
      `Marcar #${id} como verificada?`,
      'Ela entra no total verificado.',
    ],
  },
  REJECTED: {
    call: 'reject',
    verb: 'rejeitar',
    revision: 'rever · marcar como rejeitada',
    confirm: { label: 'Rejeitar', destructive: true },
    decideQuestion: ({ id, guestName, amount }) => [
      `Rejeitar contribuição #${id}?`,
      `O Pix de ${amount} de ${guestName} não chegou?`,
    ],
    reviseQuestion: ({ id }) => [`Marcar #${id} como rejeitada?`, 'Ela sai do total verificado.'],
  },
}
