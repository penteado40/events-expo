import { StyleSheet, Text } from 'react-native'

import { Glass } from '@/shared/components/ui'
import { colors, fonts, radii } from '@/shared/theme'

/**
 * No Event to show: a User who is a member of none (only a Super admin can add them), or a Super
 * admin before any Event exists. No button: creating Events is not in the app.
 */
export function NoEvents({ superAdmin }: { superAdmin: boolean }) {
  return (
    <Glass variant="card" radius={radii.eventCard} contentStyle={styles.empty}>
      <Text style={styles.title}>Nenhum evento ainda.</Text>
      <Text style={styles.text}>
        {superAdmin
          ? 'Nenhum evento foi criado.'
          : 'Um Super admin precisa te adicionar como membro.'}
      </Text>
    </Glass>
  )
}

const styles = StyleSheet.create({
  empty: { paddingVertical: 20, paddingHorizontal: 18, gap: 6 },
  title: { fontFamily: fonts.sans500, fontSize: 17, color: colors.text },
  text: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, color: colors.textMuted },
})
