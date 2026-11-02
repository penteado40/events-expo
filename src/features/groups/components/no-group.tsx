import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Button } from '@/shared/components/ui'
import { fonts, palette, useTheme } from '@/shared/theme'

type Props = { refreshing: boolean; onRefresh: () => void; onSignOut: () => void }

/**
 * D-SemGroup's body: someone with a login whom no Owner has added to a Group yet. "Atualizar" looks
 * again; "Entrar com outra conta" ends the Session.
 */
export function NoGroup({ refreshing, onRefresh, onSignOut }: Props) {
  const { colors } = useTheme()

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View accessible={false} style={styles.art}>
        <View style={[styles.rail, { borderColor: colors.border }]} />
        {(
          [
            ['coral', 76],
            ['purple', 56],
            ['green', 66],
          ] as const
        ).map(([tone, width], index) => (
          <View key={tone} style={[styles.artRow, { top: 22 + index * 50 }]}>
            <View style={[styles.artDot, { backgroundColor: palette[tone][500] }]} />
            <View style={[styles.artBar, { width, backgroundColor: palette[tone][100] }]} />
          </View>
        ))}
      </View>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
        Você ainda não está em nenhum Group
      </Text>
      <Text style={[styles.text, { color: colors.textMuted }]}>
        Quando a produção do seu grupo te adicionar, os Events aparecem aqui. Você recebe um e-mail
        avisando.
      </Text>
      <Button label="Atualizar" variant="secondary" loading={refreshing} onPress={onRefresh} />
      <Button label="Entrar com outra conta" variant="link" onPress={onSignOut} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  body: { paddingTop: 48, paddingHorizontal: 32, alignItems: 'center', gap: 16 },
  art: { width: 160, height: 160 },
  rail: {
    position: 'absolute',
    left: 50,
    top: 10,
    bottom: 10,
    borderLeftWidth: 3,
    borderStyle: 'dashed',
  },
  artRow: { position: 'absolute', left: 42, flexDirection: 'row', alignItems: 'center', gap: 12 },
  artDot: { width: 18, height: 18, borderRadius: 9 },
  artBar: { height: 18, borderRadius: 9 },
  title: { fontFamily: fonts.sans700, fontSize: 24, lineHeight: 29, textAlign: 'center' },
  text: { fontFamily: fonts.sans400, fontSize: 15, lineHeight: 22, textAlign: 'center' },
})
