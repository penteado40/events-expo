import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { EmptyText, ErrorBox, Notice, QueryError, SkeletonBlock } from '@/shared/components/ui'
import { canSeeGuests, formatEventDayTime, type GuestDataScope } from '@/shared/domain/events'
import { formatMoney } from '@/shared/domain/money'
import { colors, fonts } from '@/shared/theme'

import { contributionStatus } from '../contribution-status'
import { useContributions } from '../hooks/use-contributions'
import { useOpenReceipt } from '../hooks/use-receipt'
import { registryItemName, type RegistryItemNames } from '../registry-item-name'
import type { Contribution } from '../schemas'

type DetailEvent = { id: number; currency: string; timezone: string } & GuestDataScope

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

  if (!canSeeGuests(event)) return <Notice>ARQUIVADO · só Owners veem os convidados.</Notice>
  if (contributions.isError && !contributions.data) {
    return (
      <QueryError message={contributions.error.message} onRetry={() => contributions.refetch()} />
    )
  }
  if (!contributions.data) return <ContributionDetailSkeleton />
  const contribution = contributions.data.find((c) => c.id === contributionId)
  if (!contribution) return <EmptyText>Contribuição não encontrada.</EmptyText>

  return (
    <Details
      event={event}
      contribution={contribution}
      itemName={registryItemName(registryItemNames, contribution.registryItemId)}
    />
  )
}

type DetailsProps = { event: DetailEvent; contribution: Contribution; itemName: string }

function Details({ event, contribution, itemName }: DetailsProps) {
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
        <Row label="Presente" value={itemName} />
        <Row label="Marcada paga" value={formatEventDayTime(contribution.paidAt, event.timezone)} />
        <Row label="Comprovante" last>
          {contribution.hasReceipt ? (
            <Pressable
              onPress={() => receipt.mutate()}
              disabled={receipt.isPending}
              accessibilityRole="link"
              accessibilityLabel="Abrir comprovante"
              hitSlop={8}
            >
              <Text style={styles.value}>{receipt.isPending ? 'abrindo…' : 'anexado ↗'}</Text>
            </Pressable>
          ) : (
            <Text style={styles.value}>não anexado</Text>
          )}
        </Row>
      </View>
      {receipt.isError && <ErrorBox message={receipt.error.message} />}

      {contribution.status === 'PAID' && event.membership?.role === 'VIEWER' && (
        <Notice>Viewers não fazem a conferência.</Notice>
      )}
    </>
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
})
