import type { ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BrandMark, Icon } from '@/shared/components/ui'
import { fonts, palette, spacing, useTheme } from '@/shared/theme'

type Props = {
  title: string
  subtitle: string
  /** Shows the round back button on the header instead of the brand mark. */
  onBack?: () => void
  /** The white card that floats over the header's bottom edge. */
  children: ReactNode
  /** Below the card. */
  footer?: ReactNode
}

/**
 * The entry screens' frame (D-Login): the blue header with the timeline's dots, the title with the
 * "·", and a card floating over its edge.
 */
export function AuthLayout({ title, subtitle, onBack, children, footer }: Props) {
  const { colors, header } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 30,
              backgroundImage: `linear-gradient(160deg, ${header[0]}, ${header[1]})`,
            },
          ]}
        >
          <View accessible={false} style={styles.ring} />
          <View accessible={false} style={[styles.dot, styles.coralDot]} />
          <View accessible={false} style={[styles.dot, styles.greenDot]} />
          <View accessible={false} style={[styles.dot, styles.purpleDot]} />
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={styles.back}
            >
              <Icon name="back" color="#FFFFFF" size={20} />
            </Pressable>
          ) : (
            <BrandMark />
          )}
          <View style={styles.titles}>
            <Text accessibilityRole="header" style={styles.title}>
              {title}
              <Text style={{ color: palette.coral[100] }}>·</Text>
            </Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>{children}</View>
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 340,
    paddingHorizontal: 24,
    paddingBottom: 64,
    gap: 18,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    right: -60,
    top: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.18)',
  },
  dot: { position: 'absolute', borderRadius: 999 },
  coralDot: { right: 30, top: 90, width: 14, height: 14, backgroundColor: palette.coral[500] },
  greenDot: { right: 120, top: 230, width: 10, height: 10, backgroundColor: palette.green[500] },
  purpleDot: { right: -10, top: 200, width: 12, height: 12, backgroundColor: palette.purple[500] },
  back: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    borderRadius: spacing.touchTarget / 2,
    backgroundColor: 'rgba(0,0,0,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: { gap: 6 },
  title: { fontFamily: fonts.sans700, fontSize: 36, lineHeight: 38, color: '#FFFFFF' },
  subtitle: { fontFamily: fonts.sans400, fontSize: 16, color: palette.blue[100] },
  card: {
    marginTop: -40,
    marginHorizontal: spacing.screen,
    borderRadius: 26,
    padding: 20,
    gap: 12,
    boxShadow: '0 18px 32px -18px rgba(16,32,74,0.45)',
  },
})
