import { StyleSheet, Text } from 'react-native'

import { accentStatGlass, colors, fonts, radii } from '@/shared/theme'

import { Glass } from './glass'
import { SkeletonBlock } from './skeleton-block'

type Props = {
  label: string
  /** Undefined while loading: a skeleton of the value. */
  value?: string
  /** Card accent with lime text ("PARA CONFERIR"). */
  accent?: boolean
  /** Money gets a smaller size (22) so "R$ 1.090,00" fits half the screen. */
  money?: boolean
}

/** A stat of the Event's Resumo (README "Resumo"): Mono label and value. Half a row wide. */
export function StatCard({ label, value, accent = false, money = false }: Props) {
  return (
    <Glass
      variant={accent ? 'accent' : 'card'}
      radius={radii.stat}
      {...(accent && accentStatGlass)}
      style={styles.card}
      contentStyle={styles.content}
    >
      <Text style={[styles.label, accent && styles.accentText]}>{label}</Text>
      {value === undefined ? (
        <SkeletonBlock width="60%" height={money ? 26 : 34} radius={8} />
      ) : (
        <Text
          style={[styles.value, money && styles.money, accent && styles.accentText]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      )}
    </Glass>
  )
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  content: { paddingVertical: 14, paddingHorizontal: 16, gap: 6, minHeight: 84 },
  label: { fontFamily: fonts.mono400, fontSize: 11, color: colors.textMuted },
  value: { fontFamily: fonts.mono500, fontSize: 30, lineHeight: 36, color: colors.text },
  money: { fontSize: 22, lineHeight: 36 },
  accentText: { color: colors.accent },
})
