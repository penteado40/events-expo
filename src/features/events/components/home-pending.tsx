import { Fragment } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Glass, PressableGlass } from '@/shared/components/ui'
import { colors, fonts, radii } from '@/shared/theme'

import type { PendingRow } from '../home-summary'
import { pendingText } from './event-card'

const totalLabel = (total: number) =>
  `${total} ${total === 1 ? 'contribuição' : 'contribuições'} para conferir`

/** Início's lime "Para conferir" hero: the PAID Contributions the viewer has to verify. */
export function PendingHero({ total, onOpen }: { total: number; onOpen: () => void }) {
  return (
    <PressableGlass
      variant="accent"
      radius={radii.heroCard}
      onPress={onOpen}
      accessibilityLabel={totalLabel(total)}
      contentStyle={styles.hero}
    >
      <View style={styles.heroText}>
        <Text style={styles.heroLabel}>PARA CONFERIR</Text>
        <Text style={styles.heroSubtitle}>contribuições marcadas como pagas</Text>
      </View>
      <Text style={styles.heroCount} numberOfLines={1}>
        {total}
      </Text>
    </PressableGlass>
  )
}

/** "Conferir por evento": a row per Event with PAID ones, each opening it on Conferir. */
export function PendingByEvent({
  rows,
  onOpen,
}: {
  rows: PendingRow[]
  onOpen: (id: number) => void
}) {
  if (rows.length === 0) return null
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>CONFERIR POR EVENTO</Text>
      <Glass variant="card" radius={radii.eventCard} contentStyle={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={row.id}>
            {index > 0 && <View style={styles.divider} />}
            <Pressable
              onPress={() => onOpen(row.id)}
              accessibilityRole="button"
              accessibilityLabel={`${row.name}, ${pendingText(row.count)}`}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <Text style={styles.name} numberOfLines={1}>
                {row.name}
              </Text>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{pendingText(row.count)}</Text>
              </View>
            </Pressable>
          </Fragment>
        ))}
      </Glass>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    minHeight: 44,
  },
  heroText: { flexShrink: 1, gap: 4 },
  heroLabel: { fontFamily: fonts.mono500, fontSize: 12, letterSpacing: 0.72, color: colors.accent },
  heroSubtitle: { fontFamily: fonts.sans400, fontSize: 14, color: colors.textSoft },
  heroCount: { fontFamily: fonts.mono500, fontSize: 50, lineHeight: 56, color: colors.accent },
  section: { gap: 10 },
  sectionLabel: {
    paddingHorizontal: 6,
    fontFamily: fonts.mono400,
    fontSize: 12,
    letterSpacing: 0.72,
    color: colors.textMuted,
  },
  card: { paddingHorizontal: 18, paddingVertical: 4 },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowPressed: { opacity: 0.7 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.divider },
  name: { flexShrink: 1, fontFamily: fonts.sans400, fontSize: 16, color: colors.text },
  chip: {
    borderRadius: radii.chip,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
    backgroundColor: colors.chipAccentBg,
    borderColor: colors.chipAccentBorder,
  },
  chipText: { fontFamily: fonts.mono500, fontSize: 12, color: colors.accent },
})
