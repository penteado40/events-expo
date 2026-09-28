// TEMPORARY (PROJ-85): a showcase of the glass variants over the fixed background, so scrolling and
// every material can be checked. PROJ-87 replaces this file with the real Events list.
import { ScrollView, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Glass, PressableGlass } from '@/shared/components/ui'
import { colors, fonts, radii, spacing, textStyles, type GlassVariant } from '@/shared/theme'

const SAMPLES: { variant: GlassVariant; radius: number; label: string }[] = [
  { variant: 'accent', radius: radii.heroCard, label: 'Card acento' },
  { variant: 'card', radius: radii.eventCard, label: 'Card' },
  { variant: 'pill', radius: radii.pillButton, label: 'Pill' },
  { variant: 'sheet', radius: radii.sheet, label: 'Sheet' },
]

export default function EventsShowcase() {
  const insets = useSafeAreaInsets()
  const cards = Array.from({ length: 3 }, () => SAMPLES).flat()

  return (
    <ScrollView contentContainerStyle={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Eventos</Text>
      <Text style={styles.note}>vitrine temporária · lista real no PROJ-87</Text>
      {cards.map(({ variant, radius, label }, index) => (
        <PressableGlass key={index} variant={variant} radius={radius} contentStyle={styles.card}>
          <Text style={styles.meta}>{variant}</Text>
          <Text style={styles.label}>{label}</Text>
        </PressableGlass>
      ))}
      <Glass variant="card" radius={radii.eventCard} contentStyle={styles.card}>
        <Text style={styles.meta}>sem toque</Text>
        <Text style={styles.label}>Glass estático</Text>
      </Glass>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.tabBarClearance,
    gap: spacing.cardGap,
  },
  title: textStyles.screenTitle,
  note: { fontFamily: fonts.mono400, fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  card: { paddingVertical: 18, paddingHorizontal: 18, gap: 6 },
  meta: textStyles.monoCaption,
  label: { fontFamily: fonts.sans500, fontSize: 20, color: colors.text },
})
