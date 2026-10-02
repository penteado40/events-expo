import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, fonts, radii } from '@/shared/theme'

import { useFailedVerification } from '../hooks/use-verification'

/**
 * The Event detail's banner for a failed Verification, already rolled back: which one, and the
 * API's code and message. It stays until dismissed or until the next Verification.
 */
export function VerificationError({ eventId }: { eventId: number }) {
  const failed = useFailedVerification(eventId)
  const [dismissed, setDismissed] = useState<number | null>(null)

  if (!failed?.error || !failed.variables || failed.submittedAt === dismissed) return null
  const { contribution, outcome } = failed.variables
  const verb = outcome === 'VERIFIED' ? 'verificar' : 'rejeitar'

  return (
    <View style={styles.box} accessibilityRole="alert">
      <View style={styles.text}>
        <Text style={styles.title}>
          Não foi possível {verb} a contribuição #{contribution.id}.
        </Text>
        <Text style={styles.detail}>
          {failed.error.code} · {failed.error.message}
        </Text>
      </View>
      <Pressable
        onPress={() => setDismissed(failed.submittedAt)}
        accessibilityRole="button"
        accessibilityLabel="Fechar aviso"
        hitSlop={10}
      >
        <Text style={styles.close}>×</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: radii.input,
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // The Event detail leaves the space below to its notice (it's usually empty).
    marginBottom: 14,
  },
  text: { flex: 1, gap: 4 },
  title: { fontFamily: fonts.sans400, fontSize: 14, lineHeight: 20, color: colors.errorText },
  detail: { fontFamily: fonts.mono400, fontSize: 12, lineHeight: 18, color: colors.errorText },
  close: { fontFamily: fonts.sans400, fontSize: 18, lineHeight: 20, color: colors.errorText },
})
