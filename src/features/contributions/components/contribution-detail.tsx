import { useState, type ReactNode } from 'react'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'

import {
  ArchivedGuestsNotice,
  EmptyText,
  ErrorBox,
  Notice,
  QueryError,
  SkeletonBlock,
  useCloseSheet,
} from '@/shared/components/ui'
import {
  canVerify,
  verificationOutcomes,
  type VerificationOutcome,
} from '@/shared/domain/contributions'
import { canSeeGuests, formatEventDayTime } from '@/shared/domain/events'
import { formatMoney } from '@/shared/domain/money'
import { isViewer } from '@/shared/domain/roles'
import { colors, fonts } from '@/shared/theme'

import type { ContributionEvent } from '../contribution-event'
import { contributionStatus } from '../contribution-status'
import { useContributions } from '../hooks/use-contributions'
import { useOpenReceipt } from '../hooks/use-open-receipt'
import { useVerification } from '../hooks/use-verification'
import { VERIFICATION_OUTCOMES } from '../verification-outcome'
import { registryItemName, type RegistryItemNames } from '../registry-item-name'
import type { Contribution } from '../schemas'
import { ItemName } from './item-name'

type DetailEvent = ContributionEvent & { timezone: string }

type Props = {
  event: DetailEvent
  contributionId: number
  /** The Event's Registry item names by id, from the route (ADR-0001); undefined while loading. */
  registryItemNames: RegistryItemNames | undefined
}

/**
 * The Contribution sheet's content: number, status, amount and the table to check the Pix by.
 * There's no `GET` for one Contribution, so it finds it in the Event's list (cached when it comes
 * from Conferir).
 */
export function ContributionDetail({ event, contributionId, registryItemNames }: Props) {
  const contributions = useContributions(event)
  // Once a Verification closes the sheet, it keeps showing the Contribution as it was decided on,
  // not the optimistic change landing underneath while it animates away.
  const [closing, setClosing] = useState<Contribution | null>(null)

  if (!canSeeGuests(event)) return <ArchivedGuestsNotice />
  if (contributions.isError && !contributions.data) {
    return (
      <QueryError message={contributions.error.message} onRetry={() => contributions.refetch()} />
    )
  }
  if (!contributions.data) return <ContributionDetailSkeleton />
  const contribution = closing ?? contributions.data.find((c) => c.id === contributionId)
  if (!contribution) return <EmptyText>Contribuição não encontrada.</EmptyText>

  return (
    <Details
      event={event}
      contribution={contribution}
      itemName={registryItemName(registryItemNames, contribution.registryItemId)}
      closing={closing !== null}
      onRecorded={() => setClosing(contribution)}
    />
  )
}

type DetailsProps = {
  event: DetailEvent
  contribution: Contribution
  /** Undefined while the Registry loads. */
  itemName: string | undefined
} & VerificationProps

type VerificationProps = {
  /** A Verification was recorded and the sheet is closing: nothing more to tap. */
  closing: boolean
  onRecorded: () => void
}

function Details({ event, contribution, itemName, closing, onRecorded }: DetailsProps) {
  const status = contributionStatus(contribution.status)
  const receipt = useOpenReceipt(event.id, contribution.id)

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.number}>Contribuição #{contribution.id}</Text>
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
      </View>
      <Text style={styles.amount}>{formatMoney(contribution.amount, event.currency)}</Text>

      <View style={styles.table}>
        <Row label="Convidado" value={contribution.guestName} />
        <Row label="Presente">
          <ItemName
            name={itemName}
            style={[styles.value, styles.flexValue]}
            skeleton={{ width: 150, height: 14 }}
          />
        </Row>
        <Row label="Marcada paga" value={formatEventDayTime(contribution.paidAt, event.timezone)} />
        <Row label="Comprovante" last>
          {contribution.hasReceipt ? (
            <Pressable
              onPress={receipt.open}
              disabled={receipt.opening}
              accessibilityRole="link"
              accessibilityLabel="Abrir comprovante"
              hitSlop={8}
            >
              <Text style={styles.value}>{receipt.opening ? 'abrindo…' : 'anexado ↗'}</Text>
            </Pressable>
          ) : (
            <Text style={styles.value}>não anexado</Text>
          )}
        </Row>
      </View>
      {receipt.error && <ErrorBox message={receipt.error} />}

      {contribution.status === 'PAID' && isViewer(event.membership) && (
        <Notice>Viewers não fazem a conferência.</Notice>
      )}
      {canVerify(event) && (
        <Verification
          event={event}
          contribution={contribution}
          closing={closing}
          onRecorded={onRecorded}
        />
      )}
    </>
  )
}

/**
 * The Verification: "Rejeitar" and "Verificar Pix" on a PAID Contribution; on a decided one, a
 * secondary button to revise it to the other outcome. Each asks first. Each closes the sheet at
 * once: the screen underneath updates optimistically, and a failure shows on the Event detail.
 */
function Verification({
  event,
  contribution,
  closing,
  onRecorded,
}: { event: DetailEvent; contribution: Contribution } & VerificationProps) {
  const recordVerification = useVerification(event.id)
  const closeSheet = useCloseSheet()

  const decide = (outcome: VerificationOutcome) => {
    onRecorded()
    recordVerification(contribution, outcome)
    closeSheet()
  }
  /** Every Verification asks first: verifying vouches for a Pix, rejecting accuses a Guest. */
  const confirm = (outcome: VerificationOutcome) => {
    const copy = VERIFICATION_OUTCOMES[outcome]
    const asked = {
      id: contribution.id,
      guestName: contribution.guestName,
      amount: formatMoney(contribution.amount, event.currency),
    }
    const [title, message] =
      contribution.status === 'PAID' ? copy.decideQuestion(asked) : copy.reviseQuestion(asked)
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: copy.confirm.label,
        style: copy.confirm.destructive ? 'destructive' : 'default',
        onPress: () => decide(outcome),
      },
    ])
  }

  if (contribution.status === 'PAID') {
    return (
      <View style={styles.buttons}>
        <Pressable
          onPress={() => confirm('REJECTED')}
          disabled={closing}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.reject, pressed && styles.pressed]}
        >
          <Text style={styles.rejectText}>Rejeitar</Text>
        </Pressable>
        <Pressable
          onPress={() => confirm('VERIFIED')}
          disabled={closing}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.verify, pressed && styles.pressed]}
        >
          <Text style={styles.verifyText}>Verificar Pix</Text>
        </Pressable>
      </View>
    )
  }

  const [revision] = verificationOutcomes(contribution.status)
  if (!revision) return null
  return (
    <Pressable
      onPress={() => confirm(revision)}
      disabled={closing}
      accessibilityRole="button"
      style={({ pressed }) => [styles.revise, pressed && styles.pressed]}
    >
      <Text style={styles.reviseText}>{VERIFICATION_OUTCOMES[revision].revision}</Text>
    </Pressable>
  )
}

type RowProps = { label: string; last?: boolean } & (
  { value: string; children?: never } | { value?: never; children: ReactNode }
)

function Row({ label, value, last = false, children }: RowProps) {
  return (
    <View style={[styles.row, !last && styles.divider]}>
      <Text style={styles.label}>{label}</Text>
      {children ?? <Text style={[styles.value, styles.flexValue]}>{value}</Text>}
    </View>
  )
}

/** The sheet while the Contribution (or its Event) loads. */
export function ContributionDetailSkeleton() {
  return (
    <View style={styles.skeleton} accessibilityLabel="Carregando contribuição">
      <SkeletonBlock width={180} height={12} />
      <SkeletonBlock width={200} height={40} radius={10} />
      {[0, 1, 2, 3].map((row) => (
        <SkeletonBlock key={row} width="100%" height={14} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  number: { fontFamily: fonts.mono400, fontSize: 12, color: colors.textMuted },
  status: { fontFamily: fonts.mono400, fontSize: 12 },
  amount: { fontFamily: fonts.mono500, fontSize: 40, color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
  },
  table: { borderTopWidth: 1, borderTopColor: colors.dividerSheet },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.dividerSheet },
  label: { fontFamily: fonts.sans400, fontSize: 14, color: colors.textMuted },
  value: { fontFamily: fonts.sans400, fontSize: 14, color: colors.text },
  flexValue: { flexShrink: 1, textAlign: 'right' },
  skeleton: { gap: 14 },
  // README: 1 : 1.4, height 54, radius 27.
  buttons: { flexDirection: 'row', gap: 10 },
  button: { height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  reject: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.dangerFill,
  },
  rejectText: { fontFamily: fonts.sans500, fontSize: 15, color: colors.danger },
  verify: {
    flex: 1.4,
    backgroundColor: colors.accent,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.6)',
  },
  verifyText: { fontFamily: fonts.sans600, fontSize: 15, color: colors.onAccent },
  pressed: { transform: [{ scale: 0.98 }] },
  // A secondary button: a correction, so quieter than the PAID one's pair.
  revise: {
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.secondaryButtonBorder,
    backgroundColor: colors.secondaryButtonBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviseText: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textSoft },
})
