import { Linking, StyleSheet, Text } from 'react-native'

import { PressableGlass } from '@/shared/components/ui'
import { colors, fonts, radii } from '@/shared/theme'

import { siteLabel } from '../event-place'

/** The Resumo's Site card: the public Site's address, opened in the browser on tap. */
export function SiteCard({ siteUrl }: { siteUrl: string }) {
  return (
    <PressableGlass
      variant="card"
      radius={radii.stat}
      onPress={() => Linking.openURL(siteUrl)}
      accessibilityLabel={`Abrir o site ${siteLabel(siteUrl)}`}
      contentStyle={styles.card}
    >
      <Text style={styles.label}>Site</Text>
      <Text style={styles.url} numberOfLines={1}>
        {siteLabel(siteUrl)} ↗
      </Text>
    </PressableGlass>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  label: { fontFamily: fonts.sans400, fontSize: 14, color: colors.textMuted },
  url: { flexShrink: 1, fontFamily: fonts.mono400, fontSize: 14, color: colors.text },
})
