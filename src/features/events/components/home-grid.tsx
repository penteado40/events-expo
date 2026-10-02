import { StyleSheet, Text, View } from 'react-native'

import { Glass, PressableGlass, SkeletonBlock } from '@/shared/components/ui'
import { formatMoney, formatWholeMoney } from '@/shared/domain/money'
import { colors, fonts, radii } from '@/shared/theme'

import type { HomeSummary } from '../home-summary'

/** One currency (BRL) for now. */
const CURRENCY = 'BRL'

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const archivedLabel = (archived: number) =>
  archived === 0 ? 'nenhum arquivado' : plural(archived, 'arquivado', 'arquivados')

type Card = { label: string; value: string; subtitle: string; accessibilityLabel: string }

function cards({ active, archived, rsvps, verified, registryItems }: HomeSummary): Card[] {
  return [
    {
      label: 'EVENTOS ATIVOS',
      value: String(active),
      subtitle: archivedLabel(archived),
      accessibilityLabel: `${plural(active, 'evento ativo', 'eventos ativos')}, ${archivedLabel(archived)}`,
    },
    {
      label: 'CONFIRMADOS',
      value: String(rsvps),
      subtitle: 'nos eventos ativos',
      accessibilityLabel: `${plural(rsvps, 'confirmado', 'confirmados')} nos eventos ativos`,
    },
    {
      label: 'VERIFICADO',
      // Whole reais fit half the screen; the label keeps the centavos.
      value: formatWholeMoney(verified, CURRENCY),
      subtitle: 'em contribuições',
      accessibilityLabel: `${formatMoney(verified, CURRENCY)} verificados em contribuições`,
    },
    {
      label: 'PRESENTES',
      value: String(registryItems),
      subtitle: 'itens nas listas',
      accessibilityLabel: `${plural(registryItems, 'presente', 'presentes')} nas listas`,
    },
  ]
}

/** Two rows of two. */
const rows = <T,>(items: T[]) => [items.slice(0, 2), items.slice(2, 4)]

/** Início's 2×2 grid about the active Events; every card opens Eventos. */
export function HomeGrid({ summary, onOpen }: { summary: HomeSummary; onOpen: () => void }) {
  return (
    <View style={styles.grid}>
      {rows(cards(summary)).map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((card) => (
            <PressableGlass
              key={card.label}
              variant="card"
              radius={radii.stat}
              onPress={onOpen}
              accessibilityLabel={card.accessibilityLabel}
              style={styles.cell}
              contentStyle={styles.card}
            >
              <Text style={styles.label}>{card.label}</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {card.value}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {card.subtitle}
              </Text>
            </PressableGlass>
          ))}
        </View>
      ))}
    </View>
  )
}

/** The grid's first load: glass shaped like its cards. */
export function HomeGridSkeleton() {
  return (
    <View style={styles.grid} accessibilityLabel="Carregando resumo">
      {rows([0, 1, 2, 3]).map((row, index) => (
        <View key={index} style={styles.row}>
          {row.map((cell) => (
            <Glass
              key={cell}
              variant="card"
              radius={radii.stat}
              style={styles.cell}
              contentStyle={styles.card}
            >
              <SkeletonBlock width="70%" height={11} />
              <SkeletonBlock width="45%" height={26} radius={8} />
              <SkeletonBlock width="80%" height={12} />
            </Glass>
          ))}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  cell: { flex: 1 },
  card: { paddingVertical: 16, paddingHorizontal: 18, gap: 8, minHeight: 44 },
  label: { fontFamily: fonts.mono400, fontSize: 11, letterSpacing: 0.66, color: colors.textMuted },
  value: { fontFamily: fonts.mono500, fontSize: 26, lineHeight: 32, color: colors.text },
  subtitle: { fontFamily: fonts.sans400, fontSize: 12, color: colors.textMuted },
})
